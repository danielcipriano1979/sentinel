import { redisClient, redisConfig } from "./redis";
import { RedisKeyPatterns, RedisTTL } from "./redis-config";
import type { HostMetrics } from "@shared/schema";

/**
 * Metrics persistence service
 * Handles storing, retrieving, and managing metrics in Redis
 * Acts as a bridge between in-memory MetricsStore and Redis
 */
export class MetricsService {
  /**
   * Store a single metric data point to Redis
   * Updates both current metrics and historical time-series
   */
  async storeMetric(hostId: string, metrics: HostMetrics): Promise<void> {
    try {
      const metricsJson = JSON.stringify(metrics);
      const timestamp = metrics.timestamp;

      // 1. Update current metrics (fast lookup)
      await redisClient.setEx(
        RedisKeyPatterns.currentMetrics(hostId),
        RedisTTL.currentMetrics,
        metricsJson
      );

      // 2. Add to historical time-series (sorted set by timestamp)
      await redisClient.zAdd(RedisKeyPatterns.historicalMetrics(hostId), {
        score: timestamp,
        value: metricsJson,
      });

      // 3. Set TTL on historical data for retention
      const ttl = RedisTTL.historicalMetrics(redisConfig.metricsRetentionDays);
      await redisClient.expire(
        RedisKeyPatterns.historicalMetrics(hostId),
        ttl
      );

      // 4. Add host to index if not present
      await redisClient.sAdd(RedisKeyPatterns.hostsIndex, hostId);
    } catch (error) {
      console.error(`Failed to store metric for host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Store multiple metrics in batch
   * More efficient than storing individually
   */
  async storeMetricsBatch(hostMetrics: Map<string, HostMetrics>): Promise<void> {
    try {
      for (const [hostId, metrics] of hostMetrics) {
        await this.storeMetric(hostId, metrics);
      }
    } catch (error) {
      console.error("Failed to store metrics batch:", error);
      throw error;
    }
  }

  /**
   * Get the latest metric for a host
   */
  async getLatestMetric(hostId: string): Promise<HostMetrics | null> {
    try {
      const metricsJson = await redisClient.get(
        RedisKeyPatterns.currentMetrics(hostId)
      );
      return metricsJson ? JSON.parse(metricsJson) : null;
    } catch (error) {
      console.error(`Failed to get latest metric for host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Get latest metrics for multiple hosts
   */
  async getLatestMetricsBatch(hostIds: string[]): Promise<Map<string, HostMetrics>> {
    const result = new Map<string, HostMetrics>();

    try {
      for (const hostId of hostIds) {
        const metric = await this.getLatestMetric(hostId);
        if (metric) {
          result.set(hostId, metric);
        }
      }
      return result;
    } catch (error) {
      console.error("Failed to get latest metrics batch:", error);
      throw error;
    }
  }

  /**
   * Get all latest metrics across all hosts
   */
  async getAllLatestMetrics(): Promise<Map<string, HostMetrics>> {
    try {
      const hostIds = await redisClient.sMembers(RedisKeyPatterns.hostsIndex);
      return this.getLatestMetricsBatch(hostIds);
    } catch (error) {
      console.error("Failed to get all latest metrics:", error);
      throw error;
    }
  }

  /**
   * Get historical metrics for a host within a time range
   * @param hostId - The host ID
   * @param startTime - Start timestamp (milliseconds)
   * @param endTime - End timestamp (milliseconds), defaults to now
   * @param limit - Maximum number of results to return (default: 1000)
   */
  async getMetricsRange(
    hostId: string,
    startTime: number,
    endTime?: number,
    limit: number = 1000
  ): Promise<HostMetrics[]> {
    try {
      endTime = endTime || Date.now();

      const metricsJsonArray = await redisClient.zRangeByScore(
        RedisKeyPatterns.historicalMetrics(hostId),
        startTime,
        endTime,
        {
          LIMIT: { offset: 0, count: limit },
        }
      );

      return metricsJsonArray.map((json) => JSON.parse(json));
    } catch (error) {
      console.error(
        `Failed to get metrics range for host ${hostId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get last N metrics for a host (most recent first)
   * Useful for displaying recent trends
   */
  async getRecentMetrics(
    hostId: string,
    count: number = 100
  ): Promise<HostMetrics[]> {
    try {
      // -count to get the last N elements
      const metricsJsonArray = await redisClient.zRange(
        RedisKeyPatterns.historicalMetrics(hostId),
        -count,
        -1,
        { REV: true }
      );

      return metricsJsonArray.map((json) => JSON.parse(json));
    } catch (error) {
      console.error(`Failed to get recent metrics for host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Delete metrics for a host (for cleanup/migration)
   */
  async deleteMetrics(hostId: string): Promise<void> {
    try {
      await redisClient.del(RedisKeyPatterns.currentMetrics(hostId));
      await redisClient.del(RedisKeyPatterns.historicalMetrics(hostId));
      await redisClient.sRem(RedisKeyPatterns.hostsIndex, hostId);
    } catch (error) {
      console.error(`Failed to delete metrics for host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  async clearAllMetrics(): Promise<void> {
    try {
      const hostIds = await redisClient.sMembers(RedisKeyPatterns.hostsIndex);

      for (const hostId of hostIds) {
        await this.deleteMetrics(hostId);
      }
    } catch (error) {
      console.error("Failed to clear all metrics:", error);
      throw error;
    }
  }

  /**
   * Get count of metrics stored for a host
   */
  async getMetricsCount(hostId: string): Promise<number> {
    try {
      return await redisClient.zCard(
        RedisKeyPatterns.historicalMetrics(hostId)
      );
    } catch (error) {
      console.error(
        `Failed to get metrics count for host ${hostId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get total number of hosts with metrics
   */
  async getHostsWithMetricsCount(): Promise<number> {
    try {
      return await redisClient.sCard(RedisKeyPatterns.hostsIndex);
    } catch (error) {
      console.error("Failed to get hosts count:", error);
      throw error;
    }
  }

  /**
   * Perform cleanup of old metrics (older than retention period)
   * Can be called periodically to enforce retention policies
   */
  async cleanupOldMetrics(): Promise<number> {
    try {
      const retentionMs =
        redisConfig.metricsRetentionDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionMs;
      let deletedCount = 0;

      const hostIds = await redisClient.sMembers(RedisKeyPatterns.hostsIndex);

      for (const hostId of hostIds) {
        // Remove old metrics by score (timestamp < cutoff)
        const removed = await redisClient.zRemRangeByScore(
          RedisKeyPatterns.historicalMetrics(hostId),
          "-inf",
          cutoffTime
        );
        deletedCount += removed;
      }

      // Update last cleanup timestamp
      await redisClient.set(
        RedisKeyPatterns.lastCleanup,
        Date.now().toString()
      );

      console.log(`Cleanup completed: ${deletedCount} old metrics removed`);
      return deletedCount;
    } catch (error) {
      console.error("Failed to cleanup old metrics:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
