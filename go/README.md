# Sentinel Agent

A lightweight, production-ready monitoring agent written in Go for the Sentinel infrastructure monitoring system.

## Features

- **System Metrics Collection**: CPU usage, memory, disk, and load averages
- **Network Information**: IP addresses, MAC addresses, and interface details
- **Persistent Host ID**: Unique identifier based on MAC address that survives reinstalls
- **Automatic Heartbeats**: Sends metrics every 10 seconds (configurable)
- **Minimal Resource Usage**: Lightweight with CPU and memory limits
- **Systemd Integration**: Runs as a system service with automatic restart
- **Linux Support**: Optimized for Linux systems (amd64 and arm64)

## Requirements

- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, or similar)
- Go 1.21+ (for building from source)
- Root/sudo access (for installation)

## Quick Installation

### Option 1: Using the Install Script

```bash
# Clone or download the agent
git clone <repository-url>
cd go

# Run the installer
sudo ./install.sh
```

### Option 2: Using Make

```bash
# Build the agent
make build

# Install
sudo make install

# Configure
sudo nano /etc/sentinel-agent/config.yaml

# Start the service
sudo systemctl enable sentinel-agent
sudo systemctl start sentinel-agent
```

### Option 3: Manual Installation

```bash
# Build
go build -o sentinel-agent ./cmd/sentinel-agent

# Create directories
sudo mkdir -p /etc/sentinel-agent
sudo mkdir -p /var/lib/sentinel-agent

# Copy files
sudo cp sentinel-agent /usr/local/bin/
sudo cp config.yaml.example /etc/sentinel-agent/config.yaml
sudo cp sentinel-agent.service /etc/systemd/system/

# Configure
sudo nano /etc/sentinel-agent/config.yaml

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable sentinel-agent
sudo systemctl start sentinel-agent
```

## Configuration

Edit `/etc/sentinel-agent/config.yaml`:

```yaml
# Sentinel server URL (required)
api_endpoint: "http://your-sentinel-server:5000"

# Organization slug from your Sentinel dashboard (required)
organization_slug: "your-org-slug"

# API key for authentication (optional)
api_key: "your-api-key"

# Heartbeat interval in seconds (default: 10)
interval: 10

# Path to store the unique host ID
host_id_file: "/var/lib/sentinel-agent/host-id"
```

## Usage

### Service Commands

```bash
# Start the agent
sudo systemctl start sentinel-agent

# Stop the agent
sudo systemctl stop sentinel-agent

# Restart the agent
sudo systemctl restart sentinel-agent

# Check status
sudo systemctl status sentinel-agent

# View logs
sudo journalctl -u sentinel-agent -f

# View recent logs
sudo journalctl -u sentinel-agent -n 50
```

### Command Line

```bash
# Run with custom config
sentinel-agent -config /path/to/config.yaml

# Show version
sentinel-agent -version
```

## Data Collected

The agent collects and sends the following metrics:

### System Information
- Hostname
- Uptime
- Agent version and status

### CPU Metrics
- Usage percentage
- Number of cores
- CPU model
- Load averages (1, 5, 15 minutes)

### Memory Metrics
- Total memory
- Used memory
- Available memory
- Usage percentage
- Swap total and used

### Disk Metrics
- Total disk space
- Used space
- Available space
- Usage percentage

### Network Information
- Primary IP address
- Primary MAC address
- All network interfaces with IPs

## Host ID

The agent generates a unique host ID based on the system's MAC address. This ID:

- Persists across agent reinstalls
- Is stored in `/var/lib/sentinel-agent/host-id`
- Allows the server to track the same host even after reinstallation

## Troubleshooting

### Agent won't start

1. Check the configuration file:
   ```bash
   cat /etc/sentinel-agent/config.yaml
   ```

2. Verify the server is reachable:
   ```bash
   curl -v http://your-sentinel-server:5000/api/health
   ```

3. Check the logs:
   ```bash
   sudo journalctl -u sentinel-agent -n 100
   ```

### No data showing in dashboard

1. Verify the organization slug matches your Sentinel dashboard
2. Check network connectivity to the Sentinel server
3. Ensure the agent is running: `systemctl status sentinel-agent`

### Permission errors

Ensure the service runs as root or has access to:
- `/etc/sentinel-agent/` (read)
- `/var/lib/sentinel-agent/` (read/write)
- Network interfaces (for MAC address)

## Uninstallation

```bash
# Using make
sudo make uninstall

# Manual
sudo systemctl stop sentinel-agent
sudo systemctl disable sentinel-agent
sudo rm /etc/systemd/system/sentinel-agent.service
sudo rm /usr/local/bin/sentinel-agent
sudo systemctl daemon-reload
```

Configuration and data are preserved in:
- `/etc/sentinel-agent/` (configuration)
- `/var/lib/sentinel-agent/` (host ID)

## Building from Source

```bash
# Download dependencies
make deps

# Build for all Linux architectures
make build

# Build for current platform only
make build-local

# Run tests
make test
```

## License

MIT License - See LICENSE file for details.
