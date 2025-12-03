import { z } from "zod";

/**
 * Redis configuration schema and validation
 * Supports both URI connection strings and individual connection parameters
 */

const RedisConfigSchema = z.object({
  // Connection URI (takes precedence)
  url: z.string().optional(),

  // Individual connection parameters
  host: z.string().default("localhost"),
  port: z.coerce.number().default(6379),
  password: z.string().optional(),
  db: z.coerce.number().default(0),

  // Connection pool and timeout settings
  connectTimeout: z.coerce.number().default(5000),
  retryStrategy: z.coerce.number().default(3),
  maxRetriesPerRequest: z.coerce.number().default(3),

  // Metrics-specific settings
  metricsRetentionDays: z.coerce.number().default(30),
  batchWriteIntervalMs: z.coerce.number().default(30000), // Write to Redis every 30 seconds
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

/**
 * Validates and loads Redis configuration from environment variables
 */
export function loadRedisConfig(): RedisConfig {
  const config = {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT,
    retryStrategy: process.env.REDIS_RETRY_STRATEGY,
    maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES_PER_REQUEST,
    metricsRetentionDays: process.env.REDIS_METRICS_RETENTION_DAYS,
    batchWriteIntervalMs: process.env.REDIS_BATCH_WRITE_INTERVAL_MS,
  };

  try {
    return RedisConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors
        .map((e) => `${e.path.join(".")} (${e.message})`)
        .join(", ");
      throw new Error(`Redis configuration validation failed: ${issues}`);
    }
    throw error;
  }
}

/**
 * Generates connection options for redis client
 */
export function getRedisOptions(redisConfig: RedisConfig) {
  if (redisConfig.url) {
    return {
      url: redisConfig.url,
      socket: {
        connectTimeout: redisConfig.connectTimeout,
      },
      retry: {
        retries: redisConfig.retryStrategy,
      },
    };
  }

  return {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    socket: {
      connectTimeout: redisConfig.connectTimeout,
    },
    retry: {
      retries: redisConfig.retryStrategy,
    },
  };
}

/**
 * Redis key naming patterns for metrics storage
 */
export const RedisKeyPatterns = {
  // Current metrics cache (latest for each host)
  // Key: metrics:current:{hostId}
  // Value: JSON stringified HostMetrics
  currentMetrics: (hostId: string) => `metrics:current:${hostId}`,

  // Historical metrics (time-series data)
  // Key: metrics:history:{hostId}
  // Type: Sorted Set (score = timestamp, member = JSON)
  historicalMetrics: (hostId: string) => `metrics:history:${hostId}`,

  // Host metrics index (track which hosts have metrics)
  // Key: metrics:hosts
  // Type: Set (members = hostIds)
  hostsIndex: "metrics:hosts",

  // Metrics cleanup tracking (for retention policy)
  // Key: metrics:last_cleanup
  // Value: timestamp of last cleanup
  lastCleanup: "metrics:last_cleanup",
};

/**
 * TTL (Time To Live) configuration for Redis keys
 */
export const RedisTTL = {
  // Current metrics: 1 hour (for quick lookup)
  currentMetrics: 3600,

  // Historical metrics: configurable by retention policy (default 30 days)
  historicalMetrics: (retentionDays: number) => retentionDays * 24 * 60 * 60,

  // Session data for Redis: 24 hours
  session: 86400,
};
