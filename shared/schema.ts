import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin Users - separate table for system administrators
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"), // TOTP secret
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  auditLogs: many(auditLogs),
}));

// Admin Sessions - for tracking JWT/session invalidation
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  adminUser: one(adminUsers, {
    fields: [adminSessions.adminUserId],
    references: [adminUsers.id],
  }),
}));

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // free, pro, enterprise
  maxHosts: integer("max_hosts").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxAlertRules: integer("max_alert_rules").notNull(),
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  features: jsonb("features").default({}),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization Plans (Subscriptions)
export const organizationPlans = pgTable("organization_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // active, suspended, canceled
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationPlansRelations = relations(organizationPlans, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationPlans.organizationId],
    references: [organizations.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [organizationPlans.planId],
    references: [subscriptionPlans.id],
  }),
}));

// Audit Logs - track all admin actions
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(), // suspend_org, reactivate_org, impersonate_org, update_plan, etc
  resource: text("resource").notNull(), // organization, admin_user, etc
  resourceId: text("resource_id"), // ID of the affected resource
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  changes: jsonb("changes").default({}), // before/after values
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  adminUser: one(adminUsers, {
    fields: [auditLogs.adminUserId],
    references: [adminUsers.id],
  }),
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
}));

// Organizations (Tenants)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("active"), // active, suspended, deactivated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  hosts: many(hosts),
  customFieldDefinitions: many(customFieldDefinitions),
  users: many(organizationUsers),
  plans: many(organizationPlans),
}));

// Organization Users - team members with roles
export const organizationUsers = pgTable("organization_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("member"), // owner, admin, member, viewer
  status: text("status").notNull().default("active"), // active, deactivated
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Composite unique constraint: one email per organization
  // (handled in migration, not in schema constraint)
});

export const organizationUsersRelations = relations(organizationUsers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizationUsers.organizationId],
    references: [organizations.id],
  }),
  sessions: many(organizationSessions),
}));

// Organization User Sessions - for JWT/session management
export const organizationSessions = pgTable("organization_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => organizationUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationSessionsRelations = relations(organizationSessions, ({ one }) => ({
  user: one(organizationUsers, {
    fields: [organizationSessions.userId],
    references: [organizationUsers.id],
  }),
}));

// User Invitations - for email-based team member onboarding
export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // owner, admin, member, viewer
  invitedBy: uuid("invited_by").references(() => organizationUsers.id, { onDelete: "set null" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [userInvitations.organizationId],
    references: [organizations.id],
  }),
  invitedByUser: one(organizationUsers, {
    fields: [userInvitations.invitedBy],
    references: [organizationUsers.id],
  }),
}));

// Hosts - registered machines being monitored
export const hosts = pgTable("hosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  hostname: text("hostname").notNull(),
  displayName: text("display_name"),
  ipAddress: text("ip_address"),
  os: text("os"),
  architecture: text("architecture"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at"),
});

export const hostsRelations = relations(hosts, ({ one }) => ({
  organization: one(organizations, {
    fields: [hosts.organizationId],
    references: [organizations.id],
  }),
}));

// Agent information - stored separately for versioning
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }).unique(),
  version: text("version").notNull(),
  status: text("status").notNull().default("unknown"), // running, stopped, unknown
  pid: integer("pid"),
  startedAt: timestamp("started_at"),
  lastHeartbeat: timestamp("last_heartbeat"),
});

export const agentsRelations = relations(agents, ({ one }) => ({
  host: one(hosts, {
    fields: [agents.hostId],
    references: [hosts.id],
  }),
}));

// Custom field definitions per organization
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull(),
  type: text("type").notNull().default("text"), // text, number, boolean, select
  options: text("options").array(), // for select type
  required: boolean("required").default(false),
});

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one }) => ({
  organization: one(organizations, {
    fields: [customFieldDefinitions.organizationId],
    references: [organizations.id],
  }),
}));

// Roadmap items
export const roadmapItems = pgTable("roadmap_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed
  targetVersion: text("target_version"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alert Rules - define thresholds and conditions for alerts
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  metricType: text("metric_type").notNull(), // cpu, memory, disk, agent_status
  condition: text("condition").notNull(), // gt, lt, eq (greater than, less than, equal)
  threshold: integer("threshold").notNull(), // percentage or value
  duration: integer("duration").default(60), // seconds before triggering
  severity: text("severity").notNull().default("warning"), // info, warning, critical
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [alertRules.organizationId],
    references: [organizations.id],
  }),
  alerts: many(alerts),
}));

// Notification Channels - configure where alerts are sent
export const notificationChannels = pgTable("notification_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // webhook, email, slack
  config: jsonb("config").notNull().default({}), // webhook_url, email, slack_webhook
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationChannelsRelations = relations(notificationChannels, ({ one }) => ({
  organization: one(organizations, {
    fields: [notificationChannels.organizationId],
    references: [organizations.id],
  }),
}));

// Alert History - track triggered alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  alertRuleId: varchar("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  hostId: varchar("host_id").references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message"),
  severity: text("severity").notNull().default("warning"),
  status: text("status").notNull().default("active"), // active, acknowledged, resolved
  metricValue: integer("metric_value"),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [alerts.organizationId],
    references: [organizations.id],
  }),
  alertRule: one(alertRules, {
    fields: [alerts.alertRuleId],
    references: [alertRules.id],
  }),
  host: one(hosts, {
    fields: [alerts.hostId],
    references: [hosts.id],
  }),
}));

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  mfaSecret: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
  revokedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationPlanSchema = createInsertSchema(organizationPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationUserSchema = createInsertSchema(organizationUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerified: true,
});

export const insertOrganizationSessionSchema = createInsertSchema(organizationSessions).omit({
  id: true,
  createdAt: true,
  revokedAt: true,
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertHostSchema = createInsertSchema(hosts).omit({
  id: true,
  createdAt: true,
  lastSeenAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
});

export const insertRoadmapItemSchema = createInsertSchema(roadmapItems).omit({
  id: true,
  createdAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  triggeredAt: true,
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type OrganizationPlan = typeof organizationPlans.$inferSelect;
export type InsertOrganizationPlan = z.infer<typeof insertOrganizationPlanSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationUser = typeof organizationUsers.$inferSelect;
export type InsertOrganizationUser = z.infer<typeof insertOrganizationUserSchema>;

export type OrganizationSession = typeof organizationSessions.$inferSelect;
export type InsertOrganizationSession = z.infer<typeof insertOrganizationSessionSchema>;

export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;

export type Host = typeof hosts.$inferSelect;
export type InsertHost = z.infer<typeof insertHostSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomField = CustomFieldDefinition; // Alias for convenience

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Extended types for API responses
export type HostWithAgent = Host & {
  agent?: Agent | null;
};

// Metrics type (in-memory only, not persisted)
export interface HostMetrics {
  hostId: string;
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    loadAvg: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

// Agent heartbeat payload
export interface AgentHeartbeat {
  hostId: string;
  agentVersion: string;
  agentStatus: "running" | "stopped";
  agentPid?: number;
  metrics: Omit<HostMetrics, "hostId" | "timestamp">;
  hostInfo?: {
    hostname: string;
    os: string;
    architecture: string;
    ipAddress: string;
  };
}
