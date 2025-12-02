import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, metricsStore } from "./storage";
import {
  insertOrganizationSchema,
  insertHostSchema,
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
        alerts: 0,
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

      res.json({ success: true, hostId: host.id });
    } catch (error) {
      console.error("Error processing heartbeat:", error);
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

  return httpServer;
}
