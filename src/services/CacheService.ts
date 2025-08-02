import NodeCache from 'node-cache';
import { CacheMetrics } from '../models/Analytics.js';

/**
 * Service for caching responses to improve performance
 */
export class CacheService {
  private cache: NodeCache;
  private metrics: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
  };

  constructor(options?: {
    stdTTL?: number;
    checkperiod?: number;
    maxKeys?: number;
  }) {
    this.cache = new NodeCache({
      stdTTL: options?.stdTTL || 600, // 10 minutes default
      checkperiod: options?.checkperiod || 120, // Check for expired keys every 2 minutes
      maxKeys: options?.maxKeys || 1000,
      useClones: false, // Better performance, but be careful with object mutations
    });

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };

    // Listen for cache events
    this.cache.on('del', () => {
      this.metrics.deletes++;
    });

    this.cache.on('expired', () => {
      this.metrics.evictions++;
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.metrics.hits++;
      return value;
    }
    
    this.metrics.misses++;
    return undefined;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.cache.set(key, value, ttl || 0);
    this.metrics.sets++;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.del(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.flushAll();
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   */
  getMetrics(): CacheMetrics {
    const stats = this.cache.getStats();
    const totalRequests = this.metrics.hits + this.metrics.misses;
    
    return {
      hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
      totalRequests,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      evictions: this.metrics.evictions,
      avgTtl: 0, // NodeCache doesn't provide this
      memoryUsage: 0, // Would need process.memoryUsage() to estimate
      keyCount: stats.keys,
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get cache statistics from NodeCache
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Set TTL for existing key
   */
  async setTTL(key: string, ttl: number): Promise<boolean> {
    return this.cache.ttl(key, ttl);
  }

  /**
   * Get TTL for key
   */
  async getTTL(key: string): Promise<number> {
    return this.cache.getTtl(key);
  }

  /**
   * Create a cache key from multiple parts
   */
  static createKey(...parts: (string | number | boolean)[]): string {
    return parts
      .map(part => String(part))
      .map(part => part.replace(/[^a-zA-Z0-9._-]/g, '_'))
      .join(':');
  }

  /**
   * Cleanup expired keys manually
   */
  cleanup(): void {
    // This is automatically handled by NodeCache, but can be called manually
    // The cache will automatically remove expired keys during normal operations
  }
}