import NodeCache from 'node-cache';
import { CacheMetrics } from '../models/Analytics.js';
/**
 * Service for caching responses to improve performance and reduce external API calls.
 * Provides an in-memory cache with TTL support, metrics tracking, and automatic cleanup.
 *
 * @class CacheService
 * @example
 * ```typescript
 * const cache = new CacheService({
 *   stdTTL: 300,     // 5 minutes default TTL
 *   maxKeys: 500,    // Maximum 500 cached items
 *   checkperiod: 60  // Check for expired keys every minute
 * });
 *
 * // Cache a search result
 * await cache.set('search:lodash', searchResults, 600);
 *
 * // Retrieve cached data
 * const cached = await cache.get<SearchResult>('search:lodash');
 *
 * // Get performance metrics
 * const metrics = cache.getMetrics();
 * console.log(`Cache hit rate: ${metrics.hitRate * 100}%`);
 * ```
 */
export declare class CacheService {
    private cache;
    private metrics;
    /**
     * Creates a new CacheService instance with configurable options.
     *
     * @param options - Cache configuration options
     * @param options.stdTTL - Default time-to-live in seconds (default: 600 = 10 minutes)
     * @param options.checkperiod - Interval for checking expired keys in seconds (default: 120 = 2 minutes)
     * @param options.maxKeys - Maximum number of keys to store (default: 1000)
     *
     * @example
     * ```typescript
     * // Create cache with custom settings
     * const cache = new CacheService({
     *   stdTTL: 300,     // 5 minutes default TTL
     *   maxKeys: 2000,   // Allow up to 2000 cached items
     *   checkperiod: 30  // Check for expired keys every 30 seconds
     * });
     * ```
     */
    constructor(options?: {
        stdTTL?: number;
        checkperiod?: number;
        maxKeys?: number;
    });
    /**
     * Retrieves a value from the cache by key.
     * Automatically tracks cache hits and misses for metrics.
     *
     * @template T - The type of the cached value
     * @param key - The cache key to retrieve
     * @returns Promise resolving to the cached value or undefined if not found/expired
     *
     * @example
     * ```typescript
     * // Get a cached search result
     * const searchResult = await cache.get<SearchResult>('search:lodash');
     * if (searchResult) {
     *   console.log('Cache hit!', searchResult);
     * } else {
     *   console.log('Cache miss - need to fetch from API');
     * }
     * ```
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Stores a value in the cache with an optional custom TTL.
     *
     * @param key - The cache key to store the value under
     * @param value - The value to cache (will be stored as-is, no cloning)
     * @param ttl - Time-to-live in seconds (0 = use default TTL, undefined = never expires)
     *
     * @example
     * ```typescript
     * // Cache with default TTL
     * await cache.set('user:123', userData);
     *
     * // Cache with custom 5-minute TTL
     * await cache.set('temp:data', tempData, 300);
     *
     * // Cache permanently (never expires)
     * await cache.set('config', appConfig, 0);
     * ```
     */
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    /**
     * Removes a specific key from the cache.
     *
     * @param key - The cache key to remove
     *
     * @example
     * ```typescript
     * // Remove a specific cached item
     * await cache.delete('search:outdated-query');
     * ```
     */
    delete(key: string): Promise<void>;
    /**
     * Removes all entries from the cache.
     * Useful for cache invalidation or cleanup operations.
     *
     * @example
     * ```typescript
     * // Clear all cached data
     * await cache.clear();
     * console.log('Cache cleared');
     * ```
     */
    clear(): Promise<void>;
    /**
     * Checks if a key exists in the cache (and hasn't expired).
     *
     * @param key - The cache key to check
     * @returns Promise resolving to true if key exists, false otherwise
     *
     * @example
     * ```typescript
     * if (await cache.has('search:lodash')) {
     *   console.log('Search result is cached');
     * } else {
     *   console.log('Need to perform new search');
     * }
     * ```
     */
    has(key: string): Promise<boolean>;
    /**
     * Retrieves comprehensive cache performance metrics.
     *
     * @returns CacheMetrics object containing hit rate, memory usage, and operation counts
     *
     * @example
     * ```typescript
     * const metrics = cache.getMetrics();
     * console.log(`Hit Rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
     * console.log(`Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
     * console.log(`Total Requests: ${metrics.totalRequests}`);
     * console.log(`Cache Size: ${metrics.keyCount} keys`);
     * ```
     */
    getMetrics(): CacheMetrics;
    /**
     * Get all cache keys (for debugging)
     */
    getKeys(): string[];
    /**
     * Get cache statistics from NodeCache
     */
    getStats(): NodeCache.Stats;
    /**
     * Set TTL for existing key
     */
    setTTL(key: string, ttl: number): Promise<boolean>;
    /**
     * Get TTL for key (remaining time in seconds)
     */
    getTTL(key: string): Promise<number>;
    /**
     * Create a cache key from multiple parts
     */
    static createKey(...parts: (string | number | boolean)[]): string;
    /**
     * Cleanup expired keys manually
     */
    cleanup(): void;
}
//# sourceMappingURL=CacheService.d.ts.map