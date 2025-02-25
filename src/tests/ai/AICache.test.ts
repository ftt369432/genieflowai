import { AICache } from '../../services/cache/AICache';

describe('AICache', () => {
  let cache: AICache;

  beforeEach(() => {
    cache = new AICache({ maxSize: 10, ttl: 1000 });
  });

  describe('Response caching', () => {
    it('should cache and retrieve responses', () => {
      cache.cacheResponse('test-key', 'test-content');
      expect(cache.getCachedResponse('test-key')).toBe('test-content');
    });

    it('should return null for non-existent responses', () => {
      expect(cache.getCachedResponse('non-existent')).toBeNull();
    });

    it('should handle metadata', () => {
      const metadata = { timestamp: Date.now() };
      cache.cacheResponse('test-key', 'test-content', metadata);
      expect(cache.getCachedResponse('test-key')).toBe('test-content');
    });
  });

  describe('Embedding caching', () => {
    const testVector = [0.1, 0.2, 0.3];

    it('should cache and retrieve embeddings', () => {
      cache.cacheEmbedding('test-key', testVector);
      expect(cache.getCachedEmbedding('test-key')).toEqual(testVector);
    });

    it('should return null for non-existent embeddings', () => {
      expect(cache.getCachedEmbedding('non-existent')).toBeNull();
    });
  });

  describe('Cache management', () => {
    it('should clear response cache', () => {
      cache.cacheResponse('test-key', 'test-content');
      cache.clearResponseCache();
      expect(cache.getCachedResponse('test-key')).toBeNull();
    });

    it('should clear embedding cache', () => {
      cache.cacheEmbedding('test-key', [0.1, 0.2, 0.3]);
      cache.clearEmbeddingCache();
      expect(cache.getCachedEmbedding('test-key')).toBeNull();
    });

    it('should clear all caches', () => {
      cache.cacheResponse('test-key1', 'test-content');
      cache.cacheEmbedding('test-key2', [0.1, 0.2, 0.3]);
      cache.clearAll();
      expect(cache.getCachedResponse('test-key1')).toBeNull();
      expect(cache.getCachedEmbedding('test-key2')).toBeNull();
    });
  });

  describe('Cache statistics', () => {
    it('should track cache statistics', () => {
      cache.cacheResponse('test-key', 'test-content');
      cache.getCachedResponse('test-key');
      cache.getCachedResponse('non-existent');

      const stats = cache.getStats();
      expect(stats.responses.hits).toBeGreaterThan(0);
      expect(stats.responses.misses).toBeGreaterThan(0);
      expect(stats.responses.size).toBe(1);
    });
  });

  describe('Cache limits', () => {
    it('should respect max size limit', () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 15; i++) {
        cache.cacheResponse(`key-${i}`, `content-${i}`);
      }

      // Check that oldest entries were evicted
      expect(cache.getCachedResponse('key-0')).toBeNull();
      expect(cache.getCachedResponse('key-14')).not.toBeNull();
    });
  });
}); 