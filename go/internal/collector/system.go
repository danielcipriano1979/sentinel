package collector

import (
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemMetrics struct {
	Hostname string
	Uptime   uint64
	CPU      CPUInfo
	Memory   MemoryInfo
	Disk     DiskInfo
}

type CPUInfo struct {
	Usage     float64
	Cores     int
	Model     string
	LoadAvg1  float64
	LoadAvg5  float64
	LoadAvg15 float64
}

type MemoryInfo struct {
	Total        uint64
	Used         uint64
	Available    uint64
	UsagePercent float64
	SwapTotal    uint64
	SwapUsed     uint64
}

type DiskInfo struct {
	Total        uint64
	Used         uint64
	Available    uint64
	UsagePercent float64
	MountPoint   string
}

type SystemCollector struct{}

func NewSystemCollector() *SystemCollector {
	return &SystemCollector{}
}

func (c *SystemCollector) Collect() (*SystemMetrics, error) {
	metrics := &SystemMetrics{}

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}
	metrics.Hostname = hostname

	hostInfo, err := host.Info()
	if err == nil {
		metrics.Uptime = hostInfo.Uptime
	}

	cpuPercent, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuPercent) > 0 {
		metrics.CPU.Usage = cpuPercent[0]
	}

	metrics.CPU.Cores = runtime.NumCPU()

	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		metrics.CPU.Model = strings.TrimSpace(cpuInfo[0].ModelName)
	}

	loadAvg, err := load.Avg()
	if err == nil {
		metrics.CPU.LoadAvg1 = loadAvg.Load1
		metrics.CPU.LoadAvg5 = loadAvg.Load5
		metrics.CPU.LoadAvg15 = loadAvg.Load15
	}

	memInfo, err := mem.VirtualMemory()
	if err == nil {
		metrics.Memory.Total = memInfo.Total
		metrics.Memory.Used = memInfo.Used
		metrics.Memory.Available = memInfo.Available
		metrics.Memory.UsagePercent = memInfo.UsedPercent
	}

	swapInfo, err := mem.SwapMemory()
	if err == nil {
		metrics.Memory.SwapTotal = swapInfo.Total
		metrics.Memory.SwapUsed = swapInfo.Used
	}

	diskInfo, err := disk.Usage("/")
	if err == nil {
		metrics.Disk.Total = diskInfo.Total
		metrics.Disk.Used = diskInfo.Used
		metrics.Disk.Available = diskInfo.Free
		metrics.Disk.UsagePercent = diskInfo.UsedPercent
		metrics.Disk.MountPoint = "/"
	}

	return metrics, nil
}

func FormatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := uint64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func FormatUptime(seconds uint64) string {
	days := seconds / 86400
	hours := (seconds % 86400) / 3600
	minutes := (seconds % 3600) / 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}
