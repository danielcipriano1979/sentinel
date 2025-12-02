import {
  organizations,
  hosts,
  agents,
  customFieldDefinitions,
  roadmapItems,
  type Organization,
  type InsertOrganization,
  type Host,
  type InsertHost,
  type Agent,
  type InsertAgent,
  type CustomFieldDefinition,
  type InsertCustomFieldDefinition,
  type RoadmapItem,
  type InsertRoadmapItem,
  type HostWithAgent,
  type HostMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Hosts
  getHosts(organizationId: string): Promise<HostWithAgent[]>;
  getHost(id: string): Promise<HostWithAgent | undefined>;
  getHostByHostname(organizationId: string, hostname: string): Promise<Host | undefined>;
  createHost(host: InsertHost): Promise<Host>;
  updateHost(id: string, data: Partial<Host>): Promise<Host | undefined>;
  
  // Agents
  getAgent(hostId: string): Promise<Agent | undefined>;
  upsertAgent(agent: InsertAgent): Promise<Agent>;
  
  // Custom Field Definitions
  getCustomFieldDefinitions(organizationId: string): Promise<CustomFieldDefinition[]>;
  createCustomFieldDefinition(def: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  
  // Roadmap
  getRoadmapItems(): Promise<RoadmapItem[]>;
  createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem>;
}

// In-memory metrics storage (not persisted to database)
class MetricsStore {
  private metrics: Map<string, HostMetrics[]> = new Map();
  private maxHistory = 60; // Keep 60 data points (5 minutes at 5-second intervals)

  addMetrics(hostId: string, metrics: HostMetrics): void {
    const hostMetrics = this.metrics.get(hostId) || [];
    hostMetrics.push(metrics);
    
    // Keep only the last N data points
    if (hostMetrics.length > this.maxHistory) {
      hostMetrics.shift();
    }
    
    this.metrics.set(hostId, hostMetrics);
  }

  getMetrics(hostId: string): HostMetrics[] {
    return this.metrics.get(hostId) || [];
  }

  getLatestMetrics(hostId: string): HostMetrics | undefined {
    const hostMetrics = this.metrics.get(hostId);
    if (!hostMetrics || hostMetrics.length === 0) return undefined;
    return hostMetrics[hostMetrics.length - 1];
  }

  getAllLatestMetrics(): Record<string, HostMetrics> {
    const result: Record<string, HostMetrics> = {};
    const entries = Array.from(this.metrics.entries());
    for (const [hostId, metrics] of entries) {
      if (metrics.length > 0) {
        result[hostId] = metrics[metrics.length - 1];
      }
    }
    return result;
  }
}

export const metricsStore = new MetricsStore();

export class DatabaseStorage implements IStorage {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  // Hosts
  async getHosts(organizationId: string): Promise<HostWithAgent[]> {
    const hostsList = await db
      .select()
      .from(hosts)
      .where(eq(hosts.organizationId, organizationId))
      .orderBy(desc(hosts.lastSeenAt));

    const hostsWithAgents: HostWithAgent[] = await Promise.all(
      hostsList.map(async (host) => {
        const [agent] = await db
          .select()
          .from(agents)
          .where(eq(agents.hostId, host.id));
        return { ...host, agent: agent || null };
      })
    );

    return hostsWithAgents;
  }

  async getHost(id: string): Promise<HostWithAgent | undefined> {
    const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
    if (!host) return undefined;

    const [agent] = await db.select().from(agents).where(eq(agents.hostId, id));
    return { ...host, agent: agent || null };
  }

  async getHostByHostname(organizationId: string, hostname: string): Promise<Host | undefined> {
    const [host] = await db
      .select()
      .from(hosts)
      .where(and(eq(hosts.organizationId, organizationId), eq(hosts.hostname, hostname)));
    return host || undefined;
  }

  async createHost(host: InsertHost): Promise<Host> {
    const [created] = await db.insert(hosts).values(host).returning();
    return created;
  }

  async updateHost(id: string, data: Partial<Host>): Promise<Host | undefined> {
    const [updated] = await db
      .update(hosts)
      .set(data)
      .where(eq(hosts.id, id))
      .returning();
    return updated || undefined;
  }

  // Agents
  async getAgent(hostId: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.hostId, hostId));
    return agent || undefined;
  }

  async upsertAgent(agentData: InsertAgent): Promise<Agent> {
    const existing = await this.getAgent(agentData.hostId);
    
    if (existing) {
      const [updated] = await db
        .update(agents)
        .set({
          version: agentData.version,
          status: agentData.status,
          pid: agentData.pid,
          startedAt: agentData.startedAt,
          lastHeartbeat: agentData.lastHeartbeat,
        })
        .where(eq(agents.hostId, agentData.hostId))
        .returning();
      return updated;
    }

    const [created] = await db.insert(agents).values(agentData).returning();
    return created;
  }

  // Custom Field Definitions
  async getCustomFieldDefinitions(organizationId: string): Promise<CustomFieldDefinition[]> {
    return db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.organizationId, organizationId));
  }

  async createCustomFieldDefinition(def: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const [created] = await db.insert(customFieldDefinitions).values(def).returning();
    return created;
  }

  // Roadmap
  async getRoadmapItems(): Promise<RoadmapItem[]> {
    return db.select().from(roadmapItems).orderBy(roadmapItems.priority);
  }

  async createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem> {
    const [created] = await db.insert(roadmapItems).values(item).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
