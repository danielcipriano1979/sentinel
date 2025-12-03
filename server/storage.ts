import {
  organizations,
  hosts,
  agents,
  customFieldDefinitions,
  roadmapItems,
  alertRules,
  notificationChannels,
  alerts,
  adminUsers,
  adminSessions,
  subscriptionPlans,
  organizationPlans,
  auditLogs,
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
  type AdminUser,
  type InsertAdminUser,
  type AdminSession,
  type InsertAdminSession,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type OrganizationPlan,
  type InsertOrganizationPlan,
  type AuditLog,
  type InsertAuditLog,
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

  // Admin Users
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserMFA(adminUserId: string, mfaSecret: string | null, mfaEnabled: boolean): Promise<void>;
  updateAdminUserLastLogin(adminUserId: string): Promise<void>;

  // Admin Sessions
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  revokeAdminSession(token: string): Promise<void>;

  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;

  // Organization Plans
  getOrganizationPlan(organizationId: string): Promise<OrganizationPlan | undefined>;
  createOrganizationPlan(plan: InsertOrganizationPlan): Promise<OrganizationPlan>;
  updateOrganizationPlanStatus(organizationId: string, status: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { adminUserId?: string; organizationId?: string; limit?: number }): Promise<AuditLog[]>;

  // Organization Users
  getOrganizationUsers(organizationId: string): Promise<any[]>;
  getUserOrganizations(email: string): Promise<any[]>;
  createOrganizationUser(organizationId: string, email: string, passwordHash: string, role: string, firstName?: string, lastName?: string): Promise<any>;
  updateOrganizationUser(userId: string, organizationId: string, updates: { role?: string; status?: string }): Promise<any | undefined>;
  updateOrganizationUserRole(userId: string, organizationId: string, role: string): Promise<any | undefined>;
  removeOrganizationUser(userId: string, organizationId: string): Promise<void>;

  // User Invitations
  createUserInvitation(organizationId: string, email: string, role: string, invitedBy: string): Promise<any>;
  getUserInvitation(token: string): Promise<any | undefined>;
}

/**
 * Hybrid metrics storage: In-memory cache + Redis persistence
 * - In-memory: Fast access to recent metrics (last 5 minutes)
 * - Redis: Persistent storage of all metrics with configurable retention
 */
class MetricsStore {
  private metrics: Map<string, HostMetrics[]> = new Map();
  private maxHistory = 60; // Keep 60 data points in memory (5 minutes at 5-second intervals)
  private redisService: typeof import("./metrics-service").metricsService | null = null;
  private batchWriteTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize Redis service
   * Called after Redis client is connected
   */
  async initializeRedis() {
    try {
      const { metricsService } = await import("./metrics-service");
      this.redisService = metricsService;

      // Start periodic batch write to Redis
      this.startBatchWrite();
    } catch (error) {
      console.warn("Redis metrics service not initialized, using in-memory only:", error);
    }
  }

  /**
   * Start periodic batch write to Redis (every 30 seconds)
   */
  private startBatchWrite() {
    if (this.batchWriteTimer) return;

    this.batchWriteTimer = setInterval(async () => {
      if (!this.redisService) return;

      try {
        // Get all current metrics and write to Redis
        const latestMetrics = this.getAllLatestMetrics();
        const metricsMap = new Map(Object.entries(latestMetrics));

        if (metricsMap.size > 0) {
          await this.redisService!.storeMetricsBatch(metricsMap);
        }
      } catch (error) {
        console.error("Failed to batch write metrics to Redis:", error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop batch write timer
   */
  stopBatchWrite() {
    if (this.batchWriteTimer) {
      clearInterval(this.batchWriteTimer);
      this.batchWriteTimer = null;
    }
  }

  /**
   * Add metrics to in-memory store and schedule Redis persistence
   */
  addMetrics(hostId: string, metrics: HostMetrics): void {
    const hostMetrics = this.metrics.get(hostId) || [];
    hostMetrics.push(metrics);

    // Keep only the last N data points in memory
    if (hostMetrics.length > this.maxHistory) {
      hostMetrics.shift();
    }

    this.metrics.set(hostId, hostMetrics);
  }

  /**
   * Get metrics from in-memory cache
   */
  getMetrics(hostId: string): HostMetrics[] {
    return this.metrics.get(hostId) || [];
  }

  /**
   * Get latest metric from in-memory cache
   */
  getLatestMetrics(hostId: string): HostMetrics | undefined {
    const hostMetrics = this.metrics.get(hostId);
    if (!hostMetrics || hostMetrics.length === 0) return undefined;
    return hostMetrics[hostMetrics.length - 1];
  }

  /**
   * Get all latest metrics from in-memory cache
   */
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

  /**
   * Get metrics from Redis for a specific time range
   * Falls back to in-memory if Redis is not available
   */
  async getMetricsRange(
    hostId: string,
    startTime: number,
    endTime?: number
  ): Promise<HostMetrics[]> {
    if (!this.redisService) {
      return this.getMetrics(hostId);
    }

    try {
      return await this.redisService.getMetricsRange(hostId, startTime, endTime);
    } catch (error) {
      console.error(`Failed to get metrics range from Redis, falling back to memory:`, error);
      return this.getMetrics(hostId);
    }
  }

  /**
   * Get recent metrics from Redis
   */
  async getRecentMetrics(hostId: string, count: number = 100): Promise<HostMetrics[]> {
    if (!this.redisService) {
      return this.getMetrics(hostId).slice(-count);
    }

    try {
      return await this.redisService.getRecentMetrics(hostId, count);
    } catch (error) {
      console.error(`Failed to get recent metrics from Redis, falling back to memory:`, error);
      return this.getMetrics(hostId).slice(-count);
    }
  }

  /**
   * Force write all metrics to Redis immediately
   */
  async flushToRedis(): Promise<void> {
    if (!this.redisService) return;

    try {
      const latestMetrics = this.getAllLatestMetrics();
      const metricsMap = new Map(Object.entries(latestMetrics));

      if (metricsMap.size > 0) {
        await this.redisService.storeMetricsBatch(metricsMap);
      }
    } catch (error) {
      console.error("Failed to flush metrics to Redis:", error);
    }
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

  // Admin Users
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    const users = await db.select().from(adminUsers);
    return users;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(user).returning();
    return created;
  }

  async updateAdminUserMFA(adminUserId: string, mfaSecret: string | null, mfaEnabled: boolean): Promise<void> {
    await db
      .update(adminUsers)
      .set({ mfaSecret, mfaEnabled, updatedAt: new Date() })
      .where(eq(adminUsers.id, adminUserId));
  }

  async updateAdminUserLastLogin(adminUserId: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, adminUserId));
  }

  // Admin Sessions
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [created] = await db.insert(adminSessions).values(session).returning();
    return created;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const [session] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    return session || undefined;
  }

  async revokeAdminSession(token: string): Promise<void> {
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.token, token));
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans).values(plan).returning();
    return created;
  }

  // Organization Plans
  async getOrganizationPlan(organizationId: string): Promise<OrganizationPlan | undefined> {
    const [plan] = await db.select().from(organizationPlans).where(eq(organizationPlans.organizationId, organizationId));
    return plan || undefined;
  }

  async createOrganizationPlan(plan: InsertOrganizationPlan): Promise<OrganizationPlan> {
    const [created] = await db.insert(organizationPlans).values(plan).returning();
    return created;
  }

  async updateOrganizationPlanStatus(organizationId: string, status: string): Promise<void> {
    await db
      .update(organizationPlans)
      .set({ status, updatedAt: new Date() })
      .where(eq(organizationPlans.organizationId, organizationId));
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(filters?: { adminUserId?: string; organizationId?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);

    const whereConditions: any[] = [];
    if (filters?.adminUserId) {
      whereConditions.push(eq(auditLogs.adminUserId, filters.adminUserId));
    }
    if (filters?.organizationId) {
      whereConditions.push(eq(auditLogs.organizationId, filters.organizationId));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    query = query.orderBy(desc(auditLogs.createdAt));

    if (filters?.limit) {
      return (query as any).limit(filters.limit);
    }

    return query;
  }

  // Organization Users
  async getOrganizationUsers(organizationId: string): Promise<any[]> {
    const { organizationUsers } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    return db.select().from(organizationUsers).where(eq(organizationUsers.organizationId, organizationId));
  }

  async getUserOrganizations(email: string): Promise<any[]> {
    const { organizationUsers, organizations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const results = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizationUsers)
      .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
      .where(eq(organizationUsers.email, email));
    return results;
  }

  async createOrganizationUser(
    organizationId: string,
    email: string,
    passwordHash: string,
    role: string,
    firstName?: string,
    lastName?: string
  ): Promise<any> {
    const { organizationUsers } = await import("@shared/schema");
    const [user] = await db
      .insert(organizationUsers)
      .values({
        organizationId,
        email,
        passwordHash,
        role,
        firstName: firstName || null,
        lastName: lastName || null,
      })
      .returning();
    return user;
  }

  async updateOrganizationUser(
    userId: string,
    organizationId: string,
    updates: { role?: string; status?: string }
  ): Promise<any | undefined> {
    const { organizationUsers } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    const updateData: any = { updatedAt: new Date() };
    if (updates.role) updateData.role = updates.role;
    if (updates.status) updateData.status = updates.status;

    const [updated] = await db
      .update(organizationUsers)
      .set(updateData)
      .where(
        and(
          eq(organizationUsers.id, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .returning();
    return updated;
  }

  async updateOrganizationUserRole(
    userId: string,
    organizationId: string,
    role: string
  ): Promise<any | undefined> {
    const { organizationUsers } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    const [updated] = await db
      .update(organizationUsers)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(organizationUsers.id, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .returning();
    return updated;
  }

  async removeOrganizationUser(userId: string, organizationId: string): Promise<void> {
    const { organizationUsers } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    await db
      .delete(organizationUsers)
      .where(
        and(
          eq(organizationUsers.id, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      );
  }

  // User Invitations
  async createUserInvitation(
    organizationId: string,
    email: string,
    role: string,
    invitedBy: string
  ): Promise<any> {
    const { userInvitations } = await import("@shared/schema");
    const crypto = await import("crypto");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const [invitation] = await db
      .insert(userInvitations)
      .values({
        organizationId,
        email,
        role,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();

    return invitation;
  }

  async getUserInvitation(token: string): Promise<any | undefined> {
    const { userInvitations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    return invitation;
  }
}

export const storage = new DatabaseStorage();
