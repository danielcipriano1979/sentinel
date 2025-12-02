#!/bin/bash
#
# Sentinel Agent Installation Script
# This script installs the Sentinel monitoring agent on Linux systems
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AGENT_NAME="sentinel-agent"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/sentinel-agent"
DATA_DIR="/var/lib/sentinel-agent"
SERVICE_FILE="/etc/systemd/system/sentinel-agent.service"

# Print colored message
print_msg() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect architecture
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            BINARY_ARCH="linux-amd64"
            ;;
        aarch64|arm64)
            BINARY_ARCH="linux-arm64"
            ;;
        *)
            print_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    print_msg "Detected architecture: $ARCH ($BINARY_ARCH)"
}

# Check if Go is installed (for building from source)
check_go() {
    if command -v go &> /dev/null; then
        GO_VERSION=$(go version | awk '{print $3}')
        print_msg "Go is installed: $GO_VERSION"
        return 0
    else
        return 1
    fi
}

# Build from source
build_agent() {
    print_msg "Building agent from source..."
    
    cd "$(dirname "$0")"
    
    go mod download
    go mod tidy
    
    CGO_ENABLED=0 go build -ldflags "-s -w" -o "build/${AGENT_NAME}" ./cmd/sentinel-agent
    
    print_msg "Build complete"
}

# Install the agent
install_agent() {
    print_msg "Installing Sentinel Agent..."

    # Create directories
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$DATA_DIR"

    # Copy binary
    if [[ -f "build/${AGENT_NAME}" ]]; then
        cp "build/${AGENT_NAME}" "$INSTALL_DIR/${AGENT_NAME}"
    elif [[ -f "build/${AGENT_NAME}-${BINARY_ARCH}" ]]; then
        cp "build/${AGENT_NAME}-${BINARY_ARCH}" "$INSTALL_DIR/${AGENT_NAME}"
    else
        print_error "Binary not found. Please build first with 'make build'"
        exit 1
    fi
    
    chmod +x "$INSTALL_DIR/${AGENT_NAME}"
    print_msg "Binary installed to $INSTALL_DIR/${AGENT_NAME}"

    # Install config file if not exists
    if [[ ! -f "$CONFIG_DIR/config.yaml" ]]; then
        if [[ -f "config.yaml.example" ]]; then
            cp "config.yaml.example" "$CONFIG_DIR/config.yaml"
            print_msg "Configuration file created at $CONFIG_DIR/config.yaml"
        fi
    else
        print_warn "Configuration file already exists, skipping..."
    fi

    # Install systemd service
    if [[ -d "/etc/systemd/system" ]]; then
        cp "sentinel-agent.service" "$SERVICE_FILE"
        systemctl daemon-reload
        print_msg "Systemd service installed"
    fi
}

# Configure the agent
configure_agent() {
    print_msg "Agent Configuration"
    echo ""
    
    read -p "Enter your Sentinel server URL (e.g., http://sentinel.example.com:5000): " API_ENDPOINT
    read -p "Enter your organization slug: " ORG_SLUG
    read -p "Enter your API key (optional, press Enter to skip): " API_KEY
    
    # Update config file
    cat > "$CONFIG_DIR/config.yaml" << EOF
# Sentinel Agent Configuration
api_endpoint: "$API_ENDPOINT"
organization_slug: "$ORG_SLUG"
api_key: "$API_KEY"
interval: 10
host_id_file: "$DATA_DIR/host-id"
EOF
    
    print_msg "Configuration saved to $CONFIG_DIR/config.yaml"
}

# Start the service
start_service() {
    print_msg "Starting Sentinel Agent service..."
    
    systemctl enable sentinel-agent
    systemctl start sentinel-agent
    
    sleep 2
    
    if systemctl is-active --quiet sentinel-agent; then
        print_msg "Sentinel Agent is running!"
        systemctl status sentinel-agent --no-pager
    else
        print_error "Failed to start Sentinel Agent"
        journalctl -u sentinel-agent --no-pager -n 20
        exit 1
    fi
}

# Main installation flow
main() {
    echo ""
    echo "=================================="
    echo "  Sentinel Agent Installer"
    echo "=================================="
    echo ""

    check_root
    detect_arch

    # Check if we need to build
    if [[ ! -f "build/${AGENT_NAME}" ]] && [[ ! -f "build/${AGENT_NAME}-${BINARY_ARCH}" ]]; then
        if check_go; then
            build_agent
        else
            print_error "Pre-built binary not found and Go is not installed."
            print_error "Please install Go or provide a pre-built binary."
            exit 1
        fi
    fi

    install_agent

    echo ""
    read -p "Would you like to configure the agent now? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        configure_agent
    fi

    echo ""
    read -p "Would you like to start the agent service now? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        start_service
    fi

    echo ""
    echo "=================================="
    echo "  Installation Complete!"
    echo "=================================="
    echo ""
    echo "Commands:"
    echo "  - View status:  sudo systemctl status sentinel-agent"
    echo "  - View logs:    sudo journalctl -u sentinel-agent -f"
    echo "  - Start:        sudo systemctl start sentinel-agent"
    echo "  - Stop:         sudo systemctl stop sentinel-agent"
    echo "  - Edit config:  sudo nano $CONFIG_DIR/config.yaml"
    echo ""
}

main "$@"
