import NodeCache from "node-cache";
import { CACHE_SETTINGS } from "./constants.js";

export class CacheManager {
  private memoryCache: NodeCache;
  
  constructor() {
    // Memory cache with different TTLs for different data types
    this.memoryCache = new NodeCache({ 
      stdTTL: CACHE_SETTINGS.SHORT_TTL,
      checkperiod: CACHE_SETTINGS.CHECK_PERIOD
    });
  }
  
  // Get value from cache
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return this.memoryCache.get<T>(key);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }
  
  // Set value in cache with optional TTL
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      return this.memoryCache.set(key, value, ttl || CACHE_SETTINGS.SHORT_TTL);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }
  
  // Delete from cache
  async del(key: string): Promise<boolean> {
    try {
      return this.memoryCache.del(key) > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }
  
  // Clear all cache
  async flush(): Promise<void> {
    this.memoryCache.flushAll();
  }
  
  // Get cache stats
  getStats() {
    return this.memoryCache.getStats();
  }
  
  // Cache key generators for consistency
  static keys = {
    packageInfo: (name: string, version?: string) => 
      `pkg:${name}${version ? `@${version}` : ''}`,
    
    searchResults: (query: string, limit?: number) => 
      `search:${query}:${limit || 25}`,
    
    vulnerabilities: (name: string, version: string) => 
      `vuln:${name}@${version}`,
    
    bundleSize: (name: string, version: string) => 
      `bundle:${name}@${version}`,
    
    downloads: (name: string, period: string) => 
      `downloads:${name}:${period}`,
    
    dependencies: (path: string) => 
      `deps:${path}`
  };
}

// Global cache instance
export const cache = new CacheManager();