// Note: This is a simplified encryption implementation.
// In production, use a proper encryption library and secure key management.

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key';

export function encrypt(text: string): string {
  try {
    // In production, use a proper encryption library
    // This is just a basic example using base64 encoding
    const encoded = btoa(text);
    return encoded;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    // In production, use a proper encryption library
    // This is just a basic example using base64 decoding
    const decoded = atob(encryptedText);
    return decoded;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Helper function to generate a secure encryption key
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to securely compare strings (constant time)
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
} 