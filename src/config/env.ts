// Add debug logging
console.log('Environment variables:', {
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER,
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENABLE_CLAUDE: import.meta.env.VITE_ENABLE_CLAUDE === 'true',
  ENABLE_XAI: import.meta.env.VITE_ENABLE_XAI === 'true',
  ENABLE_DEEPSEEK: import.meta.env.VITE_ENABLE_DEEPSEEK === 'true',
  AI_ASSISTANT_PROVIDER: import.meta.env.VITE_AI_ASSISTANT_PROVIDER,
  AI_AGENT_PROVIDER: import.meta.env.VITE_AI_AGENT_PROVIDER
});

export interface EnvConfig {
  GOOGLE_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GEMINI_API_KEY: string;
  AI_MODEL: string;
  AI_PROVIDER: 'google' | 'openai' | 'claude';
  USE_MOCK: boolean;
  API_BASE_URL: string;
  ENABLE_CLAUDE: boolean;
  ENABLE_XAI: boolean;
  ENABLE_DEEPSEEK: boolean;
  AI_ASSISTANT_PROVIDER: string;
  AI_AGENT_PROVIDER: string;
}

export const ENV: EnvConfig = {
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  AI_MODEL: import.meta.env.VITE_AI_MODEL || 'gemini-pro',
  AI_PROVIDER: (import.meta.env.VITE_AI_PROVIDER || 'google') as 'google' | 'openai' | 'claude',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENABLE_CLAUDE: import.meta.env.VITE_ENABLE_CLAUDE === 'true',
  ENABLE_XAI: import.meta.env.VITE_ENABLE_XAI === 'true',
  ENABLE_DEEPSEEK: import.meta.env.VITE_ENABLE_DEEPSEEK === 'true',
  AI_ASSISTANT_PROVIDER: import.meta.env.VITE_AI_ASSISTANT_PROVIDER || 'google',
  AI_AGENT_PROVIDER: import.meta.env.VITE_AI_AGENT_PROVIDER || 'google',
};

// Add debug logging in development
if (import.meta.env.DEV) {
  console.log('Environment loaded:', {
    hasGoogleApiKey: !!ENV.GOOGLE_API_KEY,
    hasGoogleClientId: !!ENV.GOOGLE_CLIENT_ID,
    hasGeminiApiKey: !!ENV.GEMINI_API_KEY,
    geminiApiKeyPrefix: ENV.GEMINI_API_KEY.slice(0, 4),
    aiProvider: ENV.AI_PROVIDER,
    useMock: ENV.USE_MOCK
  });
}

// Validate Google API keys
if (!ENV.GEMINI_API_KEY) {
  console.error('Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your .env.local file');
  ENV.USE_MOCK = true;
} else if (!ENV.GEMINI_API_KEY.startsWith('AIza')) {
  console.error('Invalid Gemini API key format. Key must start with "AIza"');
  console.log('Key prefix:', ENV.GEMINI_API_KEY.slice(0, 4));
  ENV.USE_MOCK = true;
}

if (!ENV.GOOGLE_API_KEY || !ENV.GOOGLE_CLIENT_ID) {
  console.warn('Missing Google OAuth configuration. Some features may not work properly.');
}

// Add validation for AI provider configuration
if (ENV.AI_PROVIDER === 'google' && !ENV.GEMINI_API_KEY) {
  console.error('Gemini API key is required when using the Google AI provider');
  ENV.USE_MOCK = true;
} 