import { CacheService } from '../../services/CacheService.js';
import { TEST_CONSTANTS } from '../setup.js';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      stdTTL: TEST_CONSTANTS.CACHE_TTL,
      checkperiod: 10,
      maxKeys: 100,
    });
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 42 };

      await cacheService.set(key, value);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should delete values', async () => {
      const key = 'delete-test';
      const value = 'to-be-deleted';

      await cacheService.set(key, value);
      expect(await cacheService.get(key)).toBe(value);

      await cacheService.delete(key);
      expect(await cacheService.get(key)).toBeUndefined();
    });

    it('should check if key exists', async () => {
      const key = 'exists-test';
      
      expect(await cacheService.has(key)).toBe(false);
      
      await cacheService.set(key, 'value');
      expect(await cacheService.has(key)).toBe(true);
      
      await cacheService.delete(key);
      expect(await cacheService.has(key)).toBe(false);
    });

    it('should clear all values', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      
      expect(await cacheService.has('key1')).toBe(true);
      expect(await cacheService.has('key2')).toBe(true);
      
      await cacheService.clear();
      
      expect(await cacheService.has('key1')).toBe(false);
      expect(await cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect custom TTL', async () => {
      const key = 'ttl-test';
      const value = 'expires-soon';
      const shortTTL = 0.05; // 50ms

      await cacheService.set(key, value, shortTTL);
      
      // Should exist immediately
      expect(await cacheService.get(key)).toBe(value);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be expired
      expect(await cacheService.get(key)).toBeUndefined();
    });

    it('should set and get TTL for keys', async () => {
      const key = 'ttl-update-test';
      const value = 'test-value';

      await cacheService.set(key, value);
      
      // Set TTL to 1 second
      const success = await cacheService.setTTL(key, 1);
      expect(success).toBe(true);
      
      // Get TTL (should be around 1000ms, allowing for small differences)
      const ttl = await cacheService.getTTL(key);
      expect(ttl).toBeGreaterThan(900);
      expect(ttl).toBeLessThanOrEqual(1000);
    });
  });

  describe('Metrics and Statistics', () => {
    it('should track cache hits and misses', async () => {
      const key = 'metrics-test';
      const value = 'test-value';

      // Miss
      await cacheService.get(key);
      
      // Set and hit
      await cacheService.set(key, value);
      await cacheService.get(key);
      await cacheService.get(key); // Another hit

      const metrics = cacheService.getMetrics();
      
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBe(2/3);
      expect(metrics.keyCount).toBe(1);
    });

    it('should track cache operations', async () => {
      const key1 = 'op-test-1';
      const key2 = 'op-test-2';

      await cacheService.set(key1, 'value1');
      await cacheService.set(key2, 'value2');
      await cacheService.delete(key1);

      const stats = cacheService.getStats();
      expect(stats.keys).toBe(1); // Only key2 remains
    });

    it('should return zero hit rate with no requests', () => {
      const metrics = cacheService.getMetrics();
      expect(metrics.hitRate).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Key Management', () => {
    it('should list all keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      
      for (const key of keys) {
        await cacheService.set(key, `value-${key}`);
      }
      
      const retrievedKeys = cacheService.getKeys();
      expect(retrievedKeys.sort()).toEqual(keys.sort());
    });

    it('should create valid cache keys from parts', () => {
      const key1 = CacheService.createKey('search', 'react', 25, 0);
      expect(key1).toBe('search:react:25:0');
      
      const key2 = CacheService.createKey('package', '@types/node', '18.0.0');
      expect(key2).toBe('package:@types_node:18.0.0');
      
      const key3 = CacheService.createKey('user', 'test@example.com', true);
      expect(key3).toBe('user:test@example.com:true');
    });

    it('should sanitize special characters in keys', () => {
      const key = CacheService.createKey('test', 'with/special:chars', '@version');
      expect(key).toBe('test:with_special_chars:@version');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', async () => {
      await cacheService.set('null-test', null);
      await cacheService.set('undefined-test', undefined);
      
      expect(await cacheService.get('null-test')).toBeNull();
      expect(await cacheService.get('undefined-test')).toBeUndefined();
    });

    it('should handle complex objects', async () => {
      const complexObject = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'nested-value'
          }
        },
        date: new Date('2023-01-01'),
      };

      await cacheService.set('complex', complexObject);
      const retrieved = await cacheService.get('complex');
      
      expect(retrieved).toEqual(complexObject);
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      const value = 'long-key-value';
      
      await cacheService.set(longKey, value);
      expect(await cacheService.get(longKey)).toBe(value);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      
      // Set multiple keys concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(`concurrent-${i}`, `value-${i}`));
      }
      
      await Promise.all(promises);
      
      // Verify all keys were set
      for (let i = 0; i < 10; i++) {
        expect(await cacheService.get(`concurrent-${i}`)).toBe(`value-${i}`);
      }
    });
  });

  describe('Memory Management', () => {
    it('should respect maxKeys limit', async () => {
      const limitedCache = new CacheService({ maxKeys: 3 });
      
      // Add more keys than the limit
      await limitedCache.set('key1', 'value1');
      await limitedCache.set('key2', 'value2');
      await limitedCache.set('key3', 'value3');
      await limitedCache.set('key4', 'value4'); // Should evict oldest
      
      const keys = limitedCache.getKeys();
      expect(keys.length).toBeLessThanOrEqual(3);
      
      await limitedCache.clear();
    });
  });
});