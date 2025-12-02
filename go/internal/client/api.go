package client

import (
        "bytes"
        "encoding/json"
        "fmt"
        "io"
        "net/http"
        "time"

        "sentinel-agent/internal/collector"
)

type APIClient struct {
        endpoint    string
        orgSlug     string
        apiKey      string
        hostID      string
        httpClient  *http.Client
}

type Heartbeat struct {
        Hostname     string                   `json:"hostname"`
        AgentVersion string                   `json:"agentVersion"`
        AgentStatus  string                   `json:"agentStatus"`
        Uptime       uint64                   `json:"uptime"`
        Network      *collector.NetworkInfo   `json:"network,omitempty"`
        Metrics      MetricsPayload           `json:"metrics"`
}

type MetricsPayload struct {
        CPU    CPUMetrics    `json:"cpu"`
        Memory MemoryMetrics `json:"memory"`
        Disk   DiskMetrics   `json:"disk"`
}

type CPUMetrics struct {
        Usage     float64 `json:"usage"`
        Cores     int     `json:"cores"`
        Model     string  `json:"model"`
        LoadAvg1  float64 `json:"loadAvg1"`
        LoadAvg5  float64 `json:"loadAvg5"`
        LoadAvg15 float64 `json:"loadAvg15"`
}

type MemoryMetrics struct {
        Total        uint64  `json:"total"`
        Used         uint64  `json:"used"`
        Available    uint64  `json:"available"`
        UsagePercent float64 `json:"usagePercent"`
        SwapTotal    uint64  `json:"swapTotal"`
        SwapUsed     uint64  `json:"swapUsed"`
}

type DiskMetrics struct {
        Total        uint64  `json:"total"`
        Used         uint64  `json:"used"`
        Available    uint64  `json:"available"`
        UsagePercent float64 `json:"usagePercent"`
        MountPoint   string  `json:"mountPoint"`
}

type HeartbeatRequest struct {
        OrganizationSlug string    `json:"organizationSlug"`
        HostID           string    `json:"hostId"`
        Heartbeat        Heartbeat `json:"heartbeat"`
}

type HeartbeatResponse struct {
        Success bool   `json:"success"`
        HostID  string `json:"hostId"`
        Message string `json:"message,omitempty"`
}

func New(endpoint, orgSlug, apiKey, hostID string) *APIClient {
        return &APIClient{
                endpoint: endpoint,
                orgSlug:  orgSlug,
                apiKey:   apiKey,
                hostID:   hostID,
                httpClient: &http.Client{
                        Timeout: 30 * time.Second,
                },
        }
}

func (c *APIClient) SendHeartbeat(heartbeat Heartbeat) error {
        request := HeartbeatRequest{
                OrganizationSlug: c.orgSlug,
                HostID:           c.hostID,
                Heartbeat:        heartbeat,
        }

        jsonData, err := json.Marshal(request)
        if err != nil {
                return fmt.Errorf("failed to marshal heartbeat: %w", err)
        }

        url := fmt.Sprintf("%s/api/v2/heartbeat", c.endpoint)
        req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
        if err != nil {
                return fmt.Errorf("failed to create request: %w", err)
        }

        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("User-Agent", fmt.Sprintf("Sentinel-Agent/%s", heartbeat.AgentVersion))
        
        if c.apiKey != "" {
                req.Header.Set("X-API-Key", c.apiKey)
        }

        resp, err := c.httpClient.Do(req)
        if err != nil {
                return fmt.Errorf("failed to send request: %w", err)
        }
        defer resp.Body.Close()

        body, err := io.ReadAll(resp.Body)
        if err != nil {
                return fmt.Errorf("failed to read response: %w", err)
        }

        if resp.StatusCode < 200 || resp.StatusCode >= 300 {
                return fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
        }

        var response HeartbeatResponse
        if err := json.Unmarshal(body, &response); err != nil {
                return fmt.Errorf("failed to parse response: %w", err)
        }

        if !response.Success {
                return fmt.Errorf("heartbeat failed: %s", response.Message)
        }

        return nil
}

func (c *APIClient) GetHostID() string {
        return c.hostID
}
