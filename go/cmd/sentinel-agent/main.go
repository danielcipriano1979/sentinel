package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sentinel-agent/internal/client"
	"sentinel-agent/internal/collector"
	"sentinel-agent/internal/config"
	"sentinel-agent/internal/utils"
)

const (
	Version   = "1.0.0"
	BuildDate = "2024-12-02"
)

func main() {
	configPath := flag.String("config", "/etc/sentinel-agent/config.yaml", "Path to configuration file")
	showVersion := flag.Bool("version", false, "Show version information")
	flag.Parse()

	if *showVersion {
		fmt.Printf("Sentinel Agent v%s (Built: %s)\n", Version, BuildDate)
		os.Exit(0)
	}

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("Starting Sentinel Agent v%s", Version)

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	hostID, err := utils.GetOrCreateHostID(cfg.HostIDFile)
	if err != nil {
		log.Fatalf("Failed to get host ID: %v", err)
	}
	log.Printf("Host ID: %s", hostID)

	apiClient := client.New(cfg.APIEndpoint, cfg.OrganizationSlug, cfg.APIKey, hostID)

	sysCollector := collector.NewSystemCollector()
	netCollector := collector.NewNetworkCollector()

	ticker := time.NewTicker(time.Duration(cfg.Interval) * time.Second)
	defer ticker.Stop()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("Agent started. Sending heartbeats every %d seconds to %s", cfg.Interval, cfg.APIEndpoint)

	sendHeartbeat(apiClient, sysCollector, netCollector)

	for {
		select {
		case <-ticker.C:
			sendHeartbeat(apiClient, sysCollector, netCollector)
		case sig := <-sigChan:
			log.Printf("Received signal %v, shutting down...", sig)
			return
		}
	}
}

func sendHeartbeat(apiClient *client.APIClient, sysCollector *collector.SystemCollector, netCollector *collector.NetworkCollector) {
	metrics, err := sysCollector.Collect()
	if err != nil {
		log.Printf("Error collecting system metrics: %v", err)
		return
	}

	networkInfo, err := netCollector.Collect()
	if err != nil {
		log.Printf("Error collecting network info: %v", err)
	}

	heartbeat := client.Heartbeat{
		Hostname:     metrics.Hostname,
		AgentVersion: Version,
		AgentStatus:  "running",
		Uptime:       metrics.Uptime,
		Network:      networkInfo,
		Metrics: client.MetricsPayload{
			CPU: client.CPUMetrics{
				Usage:      metrics.CPU.Usage,
				Cores:      metrics.CPU.Cores,
				Model:      metrics.CPU.Model,
				LoadAvg1:   metrics.CPU.LoadAvg1,
				LoadAvg5:   metrics.CPU.LoadAvg5,
				LoadAvg15:  metrics.CPU.LoadAvg15,
			},
			Memory: client.MemoryMetrics{
				Total:        metrics.Memory.Total,
				Used:         metrics.Memory.Used,
				Available:    metrics.Memory.Available,
				UsagePercent: metrics.Memory.UsagePercent,
				SwapTotal:    metrics.Memory.SwapTotal,
				SwapUsed:     metrics.Memory.SwapUsed,
			},
			Disk: client.DiskMetrics{
				Total:        metrics.Disk.Total,
				Used:         metrics.Disk.Used,
				Available:    metrics.Disk.Available,
				UsagePercent: metrics.Disk.UsagePercent,
				MountPoint:   metrics.Disk.MountPoint,
			},
		},
	}

	if err := apiClient.SendHeartbeat(heartbeat); err != nil {
		log.Printf("Error sending heartbeat: %v", err)
	} else {
		log.Printf("Heartbeat sent successfully (CPU: %.1f%%, Memory: %.1f%%, Disk: %.1f%%)",
			metrics.CPU.Usage, metrics.Memory.UsagePercent, metrics.Disk.UsagePercent)
	}
}
