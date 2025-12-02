import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, metricsStore } from "./storage";
import {
  insertOrganizationSchema,
  insertHostSchema,
  insertAlertRuleSchema,
  insertNotificationChannelSchema,
  type AgentHeartbeat,
  type HostMetrics,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== Organizations ====================
  
  app.get("/api/organizations", async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const parsed = insertOrganizationSchema.parse(req.body);
      
      // Check if slug already exists
      const existing = await storage.getOrganizationBySlug(parsed.slug);
      if (existing) {
        return res.status(400).json({ error: "Organization with this slug already exists" });
      }
      
      const org = await storage.createOrganization(parsed);
      res.status(201).json(org);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // ==================== Dashboard ====================
  
  app.get("/api/dashboard", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const hosts = await storage.getHosts(orgId);
      const allMetrics = metricsStore.getAllLatestMetrics();
      const activeAlerts = await storage.getActiveAlerts(orgId);
      
      // Filter metrics to only include hosts that belong to this organization
      const hostIds = new Set(hosts.map(h => h.id));
      const metrics: Record<string, typeof allMetrics[string]> = {};
      for (const hostId of Object.keys(allMetrics)) {
        if (hostIds.has(hostId)) {
          metrics[hostId] = allMetrics[hostId];
        }
      }

      // Calculate stats (only for org's hosts)
      const activeAgents = hosts.filter((h) => {
        if (!h.lastSeenAt) return false;
        const lastSeen = new Date(h.lastSeenAt);
        const diffMinutes = (Date.now() - lastSeen.getTime()) / (1000 * 60);
        return diffMinutes <= 2;
      }).length;

      let totalCpu = 0;
      let cpuCount = 0;
      for (const hostId of Object.keys(metrics)) {
        const hostMetrics = metrics[hostId];
        if (hostMetrics) {
          totalCpu += hostMetrics.cpu.usage;
          cpuCount++;
        }
      }

      const stats = {
        totalHosts: hosts.length,
        activeAgents,
        avgCpu: cpuCount > 0 ? totalCpu / cpuCount : 0,
        alerts: activeAlerts.length,
      };

      res.json({ hosts, metrics, stats });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ==================== Hosts ====================
  
  app.get("/api/hosts", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const hosts = await storage.getHosts(orgId);
      const allMetrics = metricsStore.getAllLatestMetrics();
      
      // Filter metrics to only include hosts that belong to this organization
      const hostIds = new Set(hosts.map(h => h.id));
      const metrics: Record<string, typeof allMetrics[string]> = {};
      for (const hostId of Object.keys(allMetrics)) {
        if (hostIds.has(hostId)) {
          metrics[hostId] = allMetrics[hostId];
        }
      }

      res.json({ hosts, metrics });
    } catch (error) {
      console.error("Error fetching hosts:", error);
      res.status(500).json({ error: "Failed to fetch hosts" });
    }
  });

  app.get("/api/hosts/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      
      // Organization ID is required for tenant isolation
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      const host = await storage.getHost(req.params.id);
      
      if (!host) {
        return res.status(404).json({ error: "Host not found" });
      }

      // Validate organization ownership
      if (host.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const metrics = metricsStore.getMetrics(req.params.id);
      const currentMetrics = metricsStore.getLatestMetrics(req.params.id);

      res.json({ host, metrics, currentMetrics });
    } catch (error) {
      console.error("Error fetching host:", error);
      res.status(500).json({ error: "Failed to fetch host" });
    }
  });

  // ==================== Agents ====================
  
  app.get("/api/agents", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const hosts = await storage.getHosts(orgId);
      
      // Calculate version stats
      const versionStats: Record<string, number> = {};
      for (const host of hosts) {
        if (host.agent?.version) {
          versionStats[host.agent.version] = (versionStats[host.agent.version] || 0) + 1;
        }
      }

      res.json({ hosts, versionStats });
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  // Agent heartbeat endpoint
  app.post("/api/agent/heartbeat", async (req, res) => {
    try {
      const heartbeat = req.body as AgentHeartbeat;
      const orgId = req.headers["x-organization-id"] as string;

      if (!orgId) {
        return res.status(400).json({ error: "X-Organization-Id header required" });
      }

      // Check if organization exists
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Find or create host
      let host = heartbeat.hostInfo 
        ? await storage.getHostByHostname(orgId, heartbeat.hostInfo.hostname)
        : await storage.getHost(heartbeat.hostId);

      if (!host) {
        if (!heartbeat.hostInfo) {
          return res.status(400).json({ error: "Host not found and no hostInfo provided" });
        }

        // Create new host
        host = await storage.createHost({
          organizationId: orgId,
          hostname: heartbeat.hostInfo.hostname,
          displayName: heartbeat.hostInfo.hostname,
          ipAddress: heartbeat.hostInfo.ipAddress,
          os: heartbeat.hostInfo.os,
          architecture: heartbeat.hostInfo.architecture,
          tags: [],
          customFields: {},
        });
      } else {
        // Update host info if provided
        if (heartbeat.hostInfo) {
          await storage.updateHost(host.id, {
            ipAddress: heartbeat.hostInfo.ipAddress,
            os: heartbeat.hostInfo.os,
            architecture: heartbeat.hostInfo.architecture,
            lastSeenAt: new Date(),
          });
        } else {
          await storage.updateHost(host.id, {
            lastSeenAt: new Date(),
          });
        }
      }

      // Upsert agent info
      await storage.upsertAgent({
        hostId: host.id,
        version: heartbeat.agentVersion,
        status: heartbeat.agentStatus,
        pid: heartbeat.agentPid,
        startedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      // Store metrics in memory
      const metrics: HostMetrics = {
        hostId: host.id,
        timestamp: Date.now(),
        ...heartbeat.metrics,
      };
      metricsStore.addMetrics(host.id, metrics);

      // Evaluate alert rules and create alerts if thresholds are exceeded
      try {
        const [alertRulesList, existingActiveAlerts] = await Promise.all([
          storage.getAlertRules(orgId),
          storage.getActiveAlerts(orgId),
        ]);
        
        for (const rule of alertRulesList) {
          if (!rule.enabled) continue;
          
          let metricValue = 0;
          switch (rule.metricType) {
            case "cpu":
              metricValue = metrics.cpu.usage;
              break;
            case "memory":
              metricValue = metrics.memory.usagePercent;
              break;
            case "disk":
              metricValue = metrics.disk.usagePercent;
              break;
            case "agent_status":
              metricValue = heartbeat.agentStatus === "running" ? 1 : 0;
              break;
          }

          let shouldAlert = false;
          switch (rule.condition) {
            case "gt":
              shouldAlert = metricValue > rule.threshold;
              break;
            case "lt":
              shouldAlert = metricValue < rule.threshold;
              break;
            case "eq":
              shouldAlert = metricValue === rule.threshold;
              break;
          }

          if (shouldAlert) {
            // Check if there's already an active alert for this rule/host using cached list
            const hasActive = existingActiveAlerts.some(
              a => a.alertRuleId === rule.id && a.hostId === host.id
            );
            
            if (!hasActive) {
              await storage.createAlert({
                organizationId: orgId,
                alertRuleId: rule.id,
                hostId: host.id,
                title: rule.name,
                message: `${rule.metricType.toUpperCase()} is ${metricValue}% (threshold: ${rule.threshold}%)`,
                severity: rule.severity,
                status: "active",
                metricValue: Math.round(metricValue),
              });
            }
          }
        }
      } catch (alertError) {
        console.error("Error evaluating alerts:", alertError);
      }

      res.json({ success: true, hostId: host.id });
    } catch (error) {
      console.error("Error processing heartbeat:", error);
      res.status(500).json({ error: "Failed to process heartbeat" });
    }
  });

  // Go Agent heartbeat endpoint (uses organizationSlug in body)
  app.post("/api/v2/heartbeat", async (req, res) => {
    try {
      const { organizationSlug, hostId, heartbeat } = req.body;

      if (!organizationSlug) {
        return res.status(400).json({ error: "organizationSlug is required" });
      }

      if (!hostId) {
        return res.status(400).json({ error: "hostId is required" });
      }

      // Find organization by slug
      const org = await storage.getOrganizationBySlug(organizationSlug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const orgId = org.id;

      // Extract network info
      const networkInfo = heartbeat.network || {};
      const primaryIP = networkInfo.primary_ip || "";
      const primaryMAC = networkInfo.primary_mac || "";

      // Find existing host by hostId or hostname
      let host = await storage.getHost(hostId);
      
      if (!host) {
        // Try to find by hostname
        host = await storage.getHostByHostname(orgId, heartbeat.hostname);
      }

      if (!host) {
        // Create new host
        host = await storage.createHost({
          organizationId: orgId,
          hostname: heartbeat.hostname,
          displayName: heartbeat.hostname,
          ipAddress: primaryIP,
          os: "linux",
          architecture: "x86_64",
          tags: [],
          customFields: {
            host_id: hostId,
            mac_address: primaryMAC,
            network_interfaces: networkInfo.interfaces || [],
          },
        });
      } else {
        // Update existing host
        await storage.updateHost(host.id, {
          ipAddress: primaryIP,
          lastSeenAt: new Date(),
          customFields: {
            ...(host.customFields || {}),
            mac_address: primaryMAC,
            network_interfaces: networkInfo.interfaces || [],
          },
        });
      }

      // Upsert agent info
      await storage.upsertAgent({
        hostId: host.id,
        version: heartbeat.agentVersion || "unknown",
        status: heartbeat.agentStatus || "running",
        pid: 0,
        startedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      // Store metrics in memory (map Go agent fields to schema)
      const metrics: HostMetrics = {
        hostId: host.id,
        timestamp: Date.now(),
        cpu: {
          usage: heartbeat.metrics?.cpu?.usage || 0,
          cores: heartbeat.metrics?.cpu?.cores || 1,
          loadAvg: [
            heartbeat.metrics?.cpu?.loadAvg1 || 0,
            heartbeat.metrics?.cpu?.loadAvg5 || 0,
            heartbeat.metrics?.cpu?.loadAvg15 || 0,
          ],
        },
        memory: {
          total: heartbeat.metrics?.memory?.total || 0,
          used: heartbeat.metrics?.memory?.used || 0,
          free: heartbeat.metrics?.memory?.available || 0,
          usagePercent: heartbeat.metrics?.memory?.usagePercent || 0,
        },
        disk: {
          total: heartbeat.metrics?.disk?.total || 0,
          used: heartbeat.metrics?.disk?.used || 0,
          free: heartbeat.metrics?.disk?.available || 0,
          usagePercent: heartbeat.metrics?.disk?.usagePercent || 0,
        },
        network: {
          bytesIn: 0,
          bytesOut: 0,
          packetsIn: 0,
          packetsOut: 0,
        },
      };
      metricsStore.addMetrics(host.id, metrics);

      // Evaluate alert rules
      try {
        const [alertRulesList, existingActiveAlerts] = await Promise.all([
          storage.getAlertRules(orgId),
          storage.getActiveAlerts(orgId),
        ]);

        for (const rule of alertRulesList) {
          if (!rule.enabled) continue;

          let metricValue = 0;
          switch (rule.metricType) {
            case "cpu":
              metricValue = metrics.cpu.usage;
              break;
            case "memory":
              metricValue = metrics.memory.usagePercent;
              break;
            case "disk":
              metricValue = metrics.disk.usagePercent;
              break;
          }

          let shouldAlert = false;
          switch (rule.condition) {
            case "gt":
              shouldAlert = metricValue > rule.threshold;
              break;
            case "lt":
              shouldAlert = metricValue < rule.threshold;
              break;
            case "eq":
              shouldAlert = metricValue === rule.threshold;
              break;
          }

          if (shouldAlert) {
            const hasActive = existingActiveAlerts.some(
              (a) => a.alertRuleId === rule.id && a.hostId === host!.id
            );

            if (!hasActive) {
              await storage.createAlert({
                organizationId: orgId,
                alertRuleId: rule.id,
                hostId: host!.id,
                title: rule.name,
                message: `${rule.metricType.toUpperCase()} is ${metricValue.toFixed(1)}% (threshold: ${rule.threshold}%)`,
                severity: rule.severity,
                status: "active",
                metricValue: Math.round(metricValue),
              });
            }
          }
        }
      } catch (alertError) {
        console.error("Error evaluating alerts:", alertError);
      }

      res.json({ success: true, hostId: host.id });
    } catch (error) {
      console.error("Error processing v2 heartbeat:", error);
      res.status(500).json({ error: "Failed to process heartbeat" });
    }
  });

  // ==================== Roadmap ====================
  
  app.get("/api/roadmap", async (req, res) => {
    try {
      const items = await storage.getRoadmapItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      res.status(500).json({ error: "Failed to fetch roadmap" });
    }
  });

  // ==================== Custom Field Definitions ====================
  
  app.get("/api/custom-fields", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const definitions = await storage.getCustomFieldDefinitions(orgId);
      res.json(definitions);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ error: "Failed to fetch custom field definitions" });
    }
  });

  app.post("/api/custom-fields", async (req, res) => {
    try {
      const { organizationId, name, fieldType } = req.body;
      if (!organizationId || !name) {
        return res.status(400).json({ error: "Organization ID and name required" });
      }

      const definition = await storage.createCustomFieldDefinition({
        organizationId,
        name,
        key: name.toLowerCase().replace(/\s+/g, "_"),
        type: fieldType || "text",
      });
      res.status(201).json(definition);
    } catch (error) {
      console.error("Error creating custom field:", error);
      res.status(500).json({ error: "Failed to create custom field definition" });
    }
  });

  // ==================== Alert Rules ====================
  
  app.get("/api/alert-rules", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const rules = await storage.getAlertRules(orgId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching alert rules:", error);
      res.status(500).json({ error: "Failed to fetch alert rules" });
    }
  });

  app.post("/api/alert-rules", async (req, res) => {
    try {
      // Use orgId from query parameter, not body (prevents cross-tenant creation)
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required in query parameter" });
      }
      
      // Validate organization exists
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }
      
      // Override organizationId from body with verified query param
      const parsed = insertAlertRuleSchema.parse({ ...req.body, organizationId: orgId });
      
      const rule = await storage.createAlertRule(parsed);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating alert rule:", error);
      res.status(500).json({ error: "Failed to create alert rule" });
    }
  });

  app.patch("/api/alert-rules/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership before updating
      const existing = await storage.getAlertRule(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Alert rule not found" });
      }
      if (existing.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const rule = await storage.updateAlertRule(req.params.id, req.body);
      res.json(rule);
    } catch (error) {
      console.error("Error updating alert rule:", error);
      res.status(500).json({ error: "Failed to update alert rule" });
    }
  });

  app.delete("/api/alert-rules/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership before deleting
      const existing = await storage.getAlertRule(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Alert rule not found" });
      }
      if (existing.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteAlertRule(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting alert rule:", error);
      res.status(500).json({ error: "Failed to delete alert rule" });
    }
  });

  // ==================== Notification Channels ====================
  
  app.get("/api/notification-channels", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const channels = await storage.getNotificationChannels(orgId);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching notification channels:", error);
      res.status(500).json({ error: "Failed to fetch notification channels" });
    }
  });

  app.post("/api/notification-channels", async (req, res) => {
    try {
      // Use orgId from query parameter, not body (prevents cross-tenant creation)
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required in query parameter" });
      }
      
      // Validate organization exists
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }
      
      // Override organizationId from body with verified query param
      const parsed = insertNotificationChannelSchema.parse({ ...req.body, organizationId: orgId });
      
      const channel = await storage.createNotificationChannel(parsed);
      res.status(201).json(channel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating notification channel:", error);
      res.status(500).json({ error: "Failed to create notification channel" });
    }
  });

  app.patch("/api/notification-channels/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership before updating
      const existing = await storage.getNotificationChannel(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Notification channel not found" });
      }
      if (existing.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const channel = await storage.updateNotificationChannel(req.params.id, req.body);
      res.json(channel);
    } catch (error) {
      console.error("Error updating notification channel:", error);
      res.status(500).json({ error: "Failed to update notification channel" });
    }
  });

  app.delete("/api/notification-channels/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership before deleting
      const existing = await storage.getNotificationChannel(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Notification channel not found" });
      }
      if (existing.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteNotificationChannel(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification channel:", error);
      res.status(500).json({ error: "Failed to delete notification channel" });
    }
  });

  // ==================== Alerts ====================
  
  app.get("/api/alerts", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const status = req.query.status as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const alertsList = status === "active" 
        ? await storage.getActiveAlerts(orgId)
        : await storage.getAlerts(orgId);
      res.json(alertsList);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership BEFORE updating
      const existingAlert = await storage.getAlert(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      if (existingAlert.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const alert = await storage.updateAlertStatus(req.params.id, "acknowledged");
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  app.patch("/api/alerts/:id/resolve", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      
      // Verify ownership BEFORE updating
      const existingAlert = await storage.getAlert(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      if (existingAlert.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const alert = await storage.updateAlertStatus(req.params.id, "resolved", new Date());
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  return httpServer;
}
