import { encrypt, decrypt, generateEncryptionKey, secureCompare } from '../../utils/encryption';

describe('Encryption Utils', () => {
  describe('encrypt and decrypt', () => {
    it('should successfully encrypt and decrypt text', () => {
      const originalText = 'test-api-key-123';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
    });

    it('should handle empty strings', () => {
      const originalText = '';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should throw error for invalid encrypted text', () => {
      expect(() => decrypt('invalid-base64!')).toThrow();
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64 character hex string', () => {
      const key = generateEncryptionKey();
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('secureCompare', () => {
    it('should return true for identical strings', () => {
      expect(secureCompare('test123', 'test123')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('test123', 'test124')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(secureCompare('test123', 'test1234')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(secureCompare('', '')).toBe(true);
      expect(secureCompare('', 'test')).toBe(false);
    });
  });
}); 