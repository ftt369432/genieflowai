import { APIKeyManager } from '../../services/api/APIKeyManager';

describe('APIKeyManager', () => {
  let apiKeyManager: APIKeyManager;
  const mockStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
      length: 0,
      key: (index: number) => Object.keys(mockStorage)[index],
    };

    // Clear storage before each test
    localStorage.clear();
    
    // Get a fresh instance
    apiKeyManager = APIKeyManager.getInstance();
  });

  describe('Key Management', () => {
    it('should store and retrieve an OpenAI API key', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('openai', key);
      expect(apiKeyManager.getKey('openai')).toBe(key);
    });

    it('should store and retrieve an Anthropic API key', () => {
      const key = 'sk-ant-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('anthropic', key);
      expect(apiKeyManager.getKey('anthropic')).toBe(key);
    });

    it('should throw error for invalid key format', () => {
      const invalidKey = 'invalid-key';
      expect(() => apiKeyManager.setKey('openai', invalidKey)).toThrow();
    });

    it('should throw error when getting non-existent key', () => {
      expect(() => apiKeyManager.getKey('openai')).toThrow();
    });
  });

  describe('Key Validation', () => {
    it('should validate OpenAI key format', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef';
      const invalidKey = 'invalid-key';
      
      expect(() => apiKeyManager.setKey('openai', validKey)).not.toThrow();
      expect(() => apiKeyManager.setKey('openai', invalidKey)).toThrow();
    });

    it('should validate Anthropic key format', () => {
      const validKey = 'sk-ant-1234567890abcdef1234567890abcdef';
      const invalidKey = 'invalid-key';
      
      expect(() => apiKeyManager.setKey('anthropic', validKey)).not.toThrow();
      expect(() => apiKeyManager.setKey('anthropic', invalidKey)).toThrow();
    });
  });

  describe('Key Masking', () => {
    it('should properly mask API key', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('openai', key);
      const maskedKey = apiKeyManager.getMaskedKey('openai');
      
      expect(maskedKey).toBe('sk-1...cdef');
      expect(maskedKey.length).toBeLessThan(key.length);
    });
  });

  describe('Key Management Operations', () => {
    it('should remove a key', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('openai', key);
      expect(apiKeyManager.hasKey('openai')).toBe(true);
      
      apiKeyManager.removeKey('openai');
      expect(apiKeyManager.hasKey('openai')).toBe(false);
    });

    it('should clear all keys', () => {
      apiKeyManager.setKey('openai', 'sk-1234567890abcdef1234567890abcdef');
      apiKeyManager.setKey('anthropic', 'sk-ant-1234567890abcdef1234567890abcdef');
      
      expect(apiKeyManager.getProviders().length).toBe(2);
      
      apiKeyManager.clearKeys();
      expect(apiKeyManager.getProviders().length).toBe(0);
    });

    it('should list all providers with keys', () => {
      apiKeyManager.setKey('openai', 'sk-1234567890abcdef1234567890abcdef');
      apiKeyManager.setKey('anthropic', 'sk-ant-1234567890abcdef1234567890abcdef');
      
      const providers = apiKeyManager.getProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers.length).toBe(2);
    });
  });

  describe('Key Comparison', () => {
    it('should correctly compare keys', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('openai', key);
      
      expect(apiKeyManager.compareKey('openai', key)).toBe(true);
      expect(apiKeyManager.compareKey('openai', 'wrong-key')).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist keys across instances', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef';
      apiKeyManager.setKey('openai', key);
      
      // Get a new instance
      const newInstance = APIKeyManager.getInstance();
      expect(newInstance.getKey('openai')).toBe(key);
    });
  });
}); 