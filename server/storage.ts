import {
  organizations,
  hosts,
  agents,
  customFieldDefinitions,
  roadmapItems,
  alertRules,
  notificationChannels,
  alerts,
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
  type AlertRule,
  type InsertAlertRule,
  type NotificationChannel,
  type InsertNotificationChannel,
  type Alert,
  type InsertAlert,
  type HostWithAgent,
  type HostMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

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
  
  // Alert Rules
  getAlertRules(organizationId: string): Promise<AlertRule[]>;
  getAlertRule(id: string): Promise<AlertRule | undefined>;
  createAlertRule(rule: InsertAlertRule): Promise<AlertRule>;
  updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule | undefined>;
  deleteAlertRule(id: string): Promise<void>;
  
  // Notification Channels
  getNotificationChannels(organizationId: string): Promise<NotificationChannel[]>;
  getNotificationChannel(id: string): Promise<NotificationChannel | undefined>;
  createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel>;
  updateNotificationChannel(id: string, data: Partial<NotificationChannel>): Promise<NotificationChannel | undefined>;
  deleteNotificationChannel(id: string): Promise<void>;
  
  // Alerts
  getAlerts(organizationId: string): Promise<Alert[]>;
  getActiveAlerts(organizationId: string): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(id: string, status: string, resolvedAt?: Date): Promise<Alert | undefined>;
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

  // Alert Rules
  async getAlertRules(organizationId: string): Promise<AlertRule[]> {
    return db
      .select()
      .from(alertRules)
      .where(eq(alertRules.organizationId, organizationId))
      .orderBy(desc(alertRules.createdAt));
  }

  async getAlertRule(id: string): Promise<AlertRule | undefined> {
    const [rule] = await db.select().from(alertRules).where(eq(alertRules.id, id));
    return rule || undefined;
  }

  async createAlertRule(rule: InsertAlertRule): Promise<AlertRule> {
    const [created] = await db.insert(alertRules).values(rule).returning();
    return created;
  }

  async updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule | undefined> {
    const [updated] = await db
      .update(alertRules)
      .set(data)
      .where(eq(alertRules.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAlertRule(id: string): Promise<void> {
    await db.delete(alertRules).where(eq(alertRules.id, id));
  }

  // Notification Channels
  async getNotificationChannels(organizationId: string): Promise<NotificationChannel[]> {
    return db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.organizationId, organizationId))
      .orderBy(desc(notificationChannels.createdAt));
  }

  async getNotificationChannel(id: string): Promise<NotificationChannel | undefined> {
    const [channel] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
    return channel || undefined;
  }

  async createNotificationChannel(channel: InsertNotificationChannel): Promise<NotificationChannel> {
    const [created] = await db.insert(notificationChannels).values(channel).returning();
    return created;
  }

  async updateNotificationChannel(id: string, data: Partial<NotificationChannel>): Promise<NotificationChannel | undefined> {
    const [updated] = await db
      .update(notificationChannels)
      .set(data)
      .where(eq(notificationChannels.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
  }

  // Alerts
  async getAlerts(organizationId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.organizationId, organizationId))
      .orderBy(desc(alerts.triggeredAt));
  }

  async getActiveAlerts(organizationId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.organizationId, organizationId),
          sql`${alerts.status} IN ('active', 'acknowledged')`
        )
      )
      .orderBy(desc(alerts.triggeredAt));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [created] = await db.insert(alerts).values(alert).returning();
    return created;
  }

  async updateAlertStatus(id: string, status: string, resolvedAt?: Date): Promise<Alert | undefined> {
    const [updated] = await db
      .update(alerts)
      .set({ status, resolvedAt })
      .where(eq(alerts.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
