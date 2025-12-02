package collector

import (
	"net"
	"strings"
)

type NetworkInfo struct {
	PrimaryIP   string              `json:"primary_ip"`
	PrimaryMAC  string              `json:"primary_mac"`
	Interfaces  []InterfaceInfo     `json:"interfaces"`
}

type InterfaceInfo struct {
	Name      string   `json:"name"`
	MAC       string   `json:"mac"`
	IPs       []string `json:"ips"`
	IsUp      bool     `json:"is_up"`
	IsLoopback bool    `json:"is_loopback"`
}

type NetworkCollector struct{}

func NewNetworkCollector() *NetworkCollector {
	return &NetworkCollector{}
}

func (c *NetworkCollector) Collect() (*NetworkInfo, error) {
	info := &NetworkInfo{
		Interfaces: make([]InterfaceInfo, 0),
	}

	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, iface := range interfaces {
		ifaceInfo := InterfaceInfo{
			Name:       iface.Name,
			MAC:        iface.HardwareAddr.String(),
			IPs:        make([]string, 0),
			IsUp:       iface.Flags&net.FlagUp != 0,
			IsLoopback: iface.Flags&net.FlagLoopback != 0,
		}

		addrs, err := iface.Addrs()
		if err == nil {
			for _, addr := range addrs {
				ip := extractIP(addr.String())
				if ip != "" {
					ifaceInfo.IPs = append(ifaceInfo.IPs, ip)
				}
			}
		}

		info.Interfaces = append(info.Interfaces, ifaceInfo)

		if !ifaceInfo.IsLoopback && ifaceInfo.IsUp && len(ifaceInfo.IPs) > 0 && ifaceInfo.MAC != "" {
			if info.PrimaryIP == "" {
				for _, ip := range ifaceInfo.IPs {
					if !strings.HasPrefix(ip, "fe80:") && ip != "" {
						if isIPv4(ip) {
							info.PrimaryIP = ip
							info.PrimaryMAC = ifaceInfo.MAC
							break
						}
					}
				}
			}
		}
	}

	if info.PrimaryIP == "" {
		info.PrimaryIP = getOutboundIP()
		if info.PrimaryMAC == "" {
			info.PrimaryMAC = getPrimaryMAC(interfaces)
		}
	}

	return info, nil
}

func extractIP(addr string) string {
	if idx := strings.Index(addr, "/"); idx != -1 {
		return addr[:idx]
	}
	return addr
}

func isIPv4(ip string) bool {
	return strings.Count(ip, ":") == 0
}

func getOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return ""
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func getPrimaryMAC(interfaces []net.Interface) string {
	for _, iface := range interfaces {
		if iface.Flags&net.FlagLoopback == 0 && 
		   iface.Flags&net.FlagUp != 0 && 
		   len(iface.HardwareAddr) > 0 {
			return iface.HardwareAddr.String()
		}
	}
	return ""
}

func GetPrimaryMAC() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}
	return getPrimaryMAC(interfaces)
}
