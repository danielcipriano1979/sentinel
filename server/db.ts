import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { loadDatabaseConfig, getPoolConfig } from './db-config';

// Load and validate database configuration
const dbConfig = loadDatabaseConfig();
const poolConfig = getPoolConfig(dbConfig);

// Create connection pool with proper configuration
export const pool = new Pool(poolConfig);

// Handle pool connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize Drizzle ORM with the pool
export const db = drizzle({ client: pool, schema });

// Graceful shutdown hook
export function closeDatabase() {
  return pool.end();
}
