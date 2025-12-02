package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"sentinel-agent/internal/collector"
)

func GetOrCreateHostID(hostIDFile string) (string, error) {
	if data, err := os.ReadFile(hostIDFile); err == nil {
		hostID := strings.TrimSpace(string(data))
		if hostID != "" {
			return hostID, nil
		}
	}

	hostID, err := generateHostID()
	if err != nil {
		return "", fmt.Errorf("failed to generate host ID: %w", err)
	}

	dir := filepath.Dir(hostIDFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory for host ID file: %w", err)
	}

	if err := os.WriteFile(hostIDFile, []byte(hostID), 0644); err != nil {
		return "", fmt.Errorf("failed to save host ID: %w", err)
	}

	return hostID, nil
}

func generateHostID() (string, error) {
	mac := collector.GetPrimaryMAC()
	if mac == "" {
		return "", fmt.Errorf("no MAC address found")
	}

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	data := fmt.Sprintf("%s|%s|sentinel", mac, hostname)
	
	hash := sha256.Sum256([]byte(data))
	
	hostID := fmt.Sprintf("host-%s", hex.EncodeToString(hash[:8]))
	
	return hostID, nil
}

func GetMachineFingerprint() string {
	mac := collector.GetPrimaryMAC()
	hostname, _ := os.Hostname()
	
	data := fmt.Sprintf("%s|%s", mac, hostname)
	hash := sha256.Sum256([]byte(data))
	
	return hex.EncodeToString(hash[:16])
}
