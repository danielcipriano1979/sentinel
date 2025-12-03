import { z } from "zod";

/**
 * Database configuration schema and validation
 * Supports both direct connection strings and individual connection parameters
 */

const DbConfigSchema = z.object({
  // Connection string takes precedence if provided
  connectionString: z.string().optional(),

  // Individual connection parameters (used if connectionString is not provided)
  host: z.string().default("localhost"),
  port: z.coerce.number().default(5432),
  database: z.string(),
  user: z.string(),
  password: z.string(),

  // Connection pool configuration
  maxConnections: z.coerce.number().default(20),
  minConnections: z.coerce.number().default(2),
  connectionTimeoutMs: z.coerce.number().default(10000),
  idleTimeoutMs: z.coerce.number().default(30000),
  statementTimeoutMs: z.coerce.number().default(30000),
});

export type DbConfig = z.infer<typeof DbConfigSchema>;

/**
 * Validates and loads database configuration from environment variables
 */
export function loadDatabaseConfig(): DbConfig {
  const config = {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    maxConnections: process.env.DB_MAX_CONNECTIONS,
    minConnections: process.env.DB_MIN_CONNECTIONS,
    connectionTimeoutMs: process.env.DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: process.env.DB_IDLE_TIMEOUT_MS,
    statementTimeoutMs: process.env.DB_STATEMENT_TIMEOUT_MS,
  };

  try {
    return DbConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .map((e) => `${e.path.join(".")} (${e.message})`)
        .join(", ");
      throw new Error(
        `Database configuration validation failed: ${missingFields}`
      );
    }
    throw error;
  }
}

/**
 * Generates connection parameters for pg.Pool
 * Prioritizes connectionString if provided, otherwise builds from individual parameters
 */
export function getPoolConfig(dbConfig: DbConfig) {
  if (dbConfig.connectionString) {
    return {
      connectionString: dbConfig.connectionString,
      max: dbConfig.maxConnections,
      min: dbConfig.minConnections,
      connectionTimeoutMillis: dbConfig.connectionTimeoutMs,
      idleTimeoutMillis: dbConfig.idleTimeoutMs,
      statement_timeout: dbConfig.statementTimeoutMs,
    };
  }

  return {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: dbConfig.maxConnections,
    min: dbConfig.minConnections,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMs,
    idleTimeoutMillis: dbConfig.idleTimeoutMs,
    statement_timeout: dbConfig.statementTimeoutMs,
  };
}
