# Sentinel Agent Makefile
# Build and install the Sentinel monitoring agent

BINARY_NAME=sentinel-agent
VERSION=1.0.0
BUILD_DATE=$(shell date -u +"%Y-%m-%d")
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildDate=$(BUILD_DATE) -s -w"

# Directories
BUILD_DIR=build
CONFIG_DIR=/etc/sentinel-agent
DATA_DIR=/var/lib/sentinel-agent
BIN_DIR=/usr/local/bin

.PHONY: all build clean install uninstall deps test run

all: build

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Build the binary
build: deps
	@echo "Building $(BINARY_NAME) v$(VERSION)..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 ./cmd/sentinel-agent
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 ./cmd/sentinel-agent
	@echo "Build complete: $(BUILD_DIR)/"

# Build for current platform only
build-local: deps
	@echo "Building $(BINARY_NAME) for current platform..."
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/sentinel-agent
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Run the agent (development)
run: build-local
	@echo "Running $(BINARY_NAME)..."
	./$(BUILD_DIR)/$(BINARY_NAME) -config config.yaml

# Install the agent
install: build-local
	@echo "Installing $(BINARY_NAME)..."
	@sudo mkdir -p $(CONFIG_DIR)
	@sudo mkdir -p $(DATA_DIR)
	@sudo cp $(BUILD_DIR)/$(BINARY_NAME) $(BIN_DIR)/$(BINARY_NAME)
	@sudo chmod +x $(BIN_DIR)/$(BINARY_NAME)
	@if [ ! -f $(CONFIG_DIR)/config.yaml ]; then \
		sudo cp config.yaml.example $(CONFIG_DIR)/config.yaml; \
		echo "Configuration file created at $(CONFIG_DIR)/config.yaml"; \
		echo "Please edit it with your Sentinel server details."; \
	fi
	@if [ -d /etc/systemd/system ]; then \
		sudo cp sentinel-agent.service /etc/systemd/system/; \
		sudo systemctl daemon-reload; \
		echo "Systemd service installed. Run 'sudo systemctl enable sentinel-agent' to enable."; \
	fi
	@echo "Installation complete!"

# Uninstall the agent
uninstall:
	@echo "Uninstalling $(BINARY_NAME)..."
	@sudo systemctl stop sentinel-agent 2>/dev/null || true
	@sudo systemctl disable sentinel-agent 2>/dev/null || true
	@sudo rm -f /etc/systemd/system/sentinel-agent.service
	@sudo systemctl daemon-reload
	@sudo rm -f $(BIN_DIR)/$(BINARY_NAME)
	@echo "Uninstall complete. Config and data files preserved in $(CONFIG_DIR) and $(DATA_DIR)"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete."

# Show help
help:
	@echo "Sentinel Agent Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make deps        - Download Go dependencies"
	@echo "  make build       - Build for Linux (amd64 and arm64)"
	@echo "  make build-local - Build for current platform"
	@echo "  make test        - Run tests"
	@echo "  make run         - Build and run locally"
	@echo "  make install     - Install the agent"
	@echo "  make uninstall   - Uninstall the agent"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make help        - Show this help"
