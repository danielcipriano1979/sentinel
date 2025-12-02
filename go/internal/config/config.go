package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	APIEndpoint      string `yaml:"api_endpoint"`
	OrganizationSlug string `yaml:"organization_slug"`
	APIKey           string `yaml:"api_key"`
	Interval         int    `yaml:"interval"`
	HostIDFile       string `yaml:"host_id_file"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	cfg := &Config{
		Interval:   10,
		HostIDFile: "/var/lib/sentinel-agent/host-id",
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	if cfg.APIEndpoint == "" {
		return nil, fmt.Errorf("api_endpoint is required")
	}

	if cfg.OrganizationSlug == "" {
		return nil, fmt.Errorf("organization_slug is required")
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if c.APIEndpoint == "" {
		return fmt.Errorf("api_endpoint is required")
	}
	if c.OrganizationSlug == "" {
		return fmt.Errorf("organization_slug is required")
	}
	if c.Interval < 1 {
		return fmt.Errorf("interval must be at least 1 second")
	}
	return nil
}
