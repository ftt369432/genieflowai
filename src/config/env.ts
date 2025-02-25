// Add debug logging
console.log('Environment variables:', {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  OPENAI_ORG_ID: import.meta.env.VITE_OPENAI_ORG_ID,
  OPENAI_PROJECT_ID: import.meta.env.VITE_OPENAI_PROJECT_ID,
  OPENAI_PROJECT_NAME: import.meta.env.VITE_OPENAI_PROJECT_NAME,
  OPENAI_API_VERSION: import.meta.env.VITE_OPENAI_API_VERSION,
  OPENAI_MODEL_NAME: import.meta.env.VITE_OPENAI_MODEL_NAME,
  OPENAI_MAX_TOKENS: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000'),
  AI_MODEL: import.meta.env.VITE_AI_MODEL,
  AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER,
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENABLE_CLAUDE: import.meta.env.VITE_ENABLE_CLAUDE === 'true',
  ENABLE_XAI: import.meta.env.VITE_ENABLE_XAI === 'true',
  ENABLE_DEEPSEEK: import.meta.env.VITE_ENABLE_DEEPSEEK === 'true',
  AI_ASSISTANT_PROVIDER: import.meta.env.VITE_AI_ASSISTANT_PROVIDER,
  AI_AGENT_PROVIDER: import.meta.env.VITE_AI_AGENT_PROVIDER,
  keyStart: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 8),
  keyLength: import.meta.env.VITE_OPENAI_API_KEY?.length,
  useMock: !import.meta.env.VITE_OPENAI_API_KEY
});

export interface EnvConfig {
  OPENAI_API_KEY: string;
  OPENAI_ORG_ID: string;
  OPENAI_PROJECT_ID: string;
  OPENAI_PROJECT_NAME: string;
  OPENAI_API_VERSION: string;
  OPENAI_MODEL_NAME: string;
  OPENAI_MAX_TOKENS: number;
  AI_MODEL: string;
  AI_PROVIDER: 'openai' | 'gemini' | 'claude';
  USE_MOCK: boolean;
  API_BASE_URL: string;
  ENABLE_CLAUDE: boolean;
  ENABLE_XAI: boolean;
  ENABLE_DEEPSEEK: boolean;
  AI_ASSISTANT_PROVIDER: string;
  AI_AGENT_PROVIDER: string;
}

export const ENV: EnvConfig = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  OPENAI_ORG_ID: import.meta.env.VITE_OPENAI_ORG_ID || '',
  OPENAI_PROJECT_ID: import.meta.env.VITE_OPENAI_PROJECT_ID || '',
  OPENAI_PROJECT_NAME: import.meta.env.VITE_OPENAI_PROJECT_NAME || 'GenieFlow',
  OPENAI_API_VERSION: import.meta.env.VITE_OPENAI_API_VERSION || '2024-02',
  OPENAI_MODEL_NAME: import.meta.env.VITE_OPENAI_MODEL_NAME || 'gpt-4',
  OPENAI_MAX_TOKENS: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000'),
  AI_MODEL: import.meta.env.VITE_AI_MODEL || 'gpt-4-turbo-preview',
  AI_PROVIDER: (import.meta.env.VITE_AI_PROVIDER || 'openai') as 'openai' | 'gemini' | 'claude',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENABLE_CLAUDE: import.meta.env.VITE_ENABLE_CLAUDE === 'true',
  ENABLE_XAI: import.meta.env.VITE_ENABLE_XAI === 'true',
  ENABLE_DEEPSEEK: import.meta.env.VITE_ENABLE_DEEPSEEK === 'true',
  AI_ASSISTANT_PROVIDER: import.meta.env.VITE_AI_ASSISTANT_PROVIDER || 'openai',
  AI_AGENT_PROVIDER: import.meta.env.VITE_AI_AGENT_PROVIDER || 'openai',
};

// Add debug logging in development
if (import.meta.env.DEV) {
  console.log('Environment loaded:', {
    hasApiKey: !!ENV.OPENAI_API_KEY,
    apiKeyLength: ENV.OPENAI_API_KEY?.length,
    hasOrgId: !!ENV.OPENAI_ORG_ID,
    model: ENV.AI_MODEL,
    useMock: ENV.USE_MOCK
  });
}

// Remove the API key validation
if (ENV.OPENAI_API_KEY) {
  const isProjectKey = ENV.OPENAI_API_KEY.startsWith('sk-proj-');
  const isStandardKey = ENV.OPENAI_API_KEY.startsWith('sk-');

  if (!isProjectKey && !isStandardKey) {
    console.warn('Invalid API key format. Using mock data instead.');
  }
} 