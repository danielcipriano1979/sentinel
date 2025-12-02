import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations (Tenants)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  hosts: many(hosts),
  customFieldDefinitions: many(customFieldDefinitions),
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

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
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

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Host = typeof hosts.$inferSelect;
export type InsertHost = z.infer<typeof insertHostSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;

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
