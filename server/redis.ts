import { createClient, type RedisClientType } from "redis";
import { loadRedisConfig, getRedisOptions } from "./redis-config";

// Load and validate Redis configuration
const redisConfig = loadRedisConfig();
const redisOptions = getRedisOptions(redisConfig);

// Create Redis client
export const redisClient: RedisClientType = createClient(redisOptions);

// Handle connection events
redisClient.on("error", (err) => {
  console.error("Redis client error", err);
});

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("ready", () => {
  console.log("Redis client ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis client reconnecting");
});

/**
 * Connect to Redis
 * Should be called during application startup
 */
export async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("Successfully connected to Redis");
    return true;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 * Should be called during application shutdown
 */
export async function disconnectRedis() {
  try {
    await redisClient.quit();
    console.log("Redis client disconnected");
  } catch (error) {
    console.error("Error disconnecting from Redis:", error);
  }
}

/**
 * Check Redis connection status
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
}

// Export config for use in other modules
export { redisConfig };
