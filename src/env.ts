// Environment variables access
const processEnv = import.meta.env || process.env || {};

// Log environment variables for debugging (masked for security)
console.log('Environment variables:', {
  GOOGLE_API_KEY: processEnv.VITE_GOOGLE_API_KEY ? 'defined' : 'undefined',
  GOOGLE_CLIENT_ID: processEnv.VITE_GOOGLE_CLIENT_ID ? 'defined' : 'undefined',
  GEMINI_API_KEY: processEnv.VITE_GEMINI_API_KEY ? 'defined' : 'undefined',
  OPENAI_API_KEY: processEnv.VITE_OPENAI_API_KEY ? 'defined' : 'undefined',
  AI_PROVIDER: processEnv.VITE_AI_PROVIDER,
  USE_MOCK: processEnv.VITE_USE_MOCK === 'true',
  NODE_ENV: processEnv.NODE_ENV,
});

/**
 * Environment configuration with defaults
 */
export const env = {
  // Google API configuration 
  GOOGLE_API_KEY: processEnv.VITE_GOOGLE_API_KEY || '',
  GOOGLE_CLIENT_ID: processEnv.VITE_GOOGLE_CLIENT_ID || '',
  
  // AI services configuration
  GEMINI_API_KEY: processEnv.VITE_GEMINI_API_KEY || processEnv.VITE_GOOGLE_API_KEY || '',
  OPENAI_API_KEY: processEnv.VITE_OPENAI_API_KEY || '',
  
  // App configuration
  NODE_ENV: processEnv.NODE_ENV || 'development',
  IS_PROD: processEnv.NODE_ENV === 'production',
  IS_DEV: processEnv.NODE_ENV !== 'production',
  
  // Feature flags
  useMock: processEnv.VITE_USE_MOCK === 'true',
  aiProvider: processEnv.VITE_AI_PROVIDER || 'google',
  
  // Computed properties
  get hasGoogleApiKey() {
    return Boolean(this.GOOGLE_API_KEY);
  },
  
  get hasGoogleClientId() {
    return Boolean(this.GOOGLE_CLIENT_ID);
  },
  
  get hasGeminiApiKey() {
    return Boolean(this.GEMINI_API_KEY);
  },
  
  get hasOpenAiKey() {
    return Boolean(this.OPENAI_API_KEY);
  }
};

// Log environment status
console.log('Environment loaded:', {
  hasGoogleApiKey: env.hasGoogleApiKey,
  hasGoogleClientId: env.hasGoogleClientId,
  hasGeminiApiKey: env.hasGeminiApiKey,
  aiProvider: env.aiProvider,
  useMock: env.useMock
}); 