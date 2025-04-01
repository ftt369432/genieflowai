/**
 * Environment configuration for the application
 */

import { getEnvironmentVariable, parseBoolean } from './utils';

// Environment variable constants
export const NODE_ENV = import.meta.env?.MODE || 'development';
export const IS_DEV = NODE_ENV === 'development';
export const IS_PROD = NODE_ENV === 'production';

// API URLs
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3007/api';
const API_BASE_URL = API_URL.replace(/\/api$/, '');

// AI
const MODEL = import.meta.env?.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
const AI_PROVIDER = import.meta.env?.VITE_AI_PROVIDER || 'google';

// Feature flags
const USE_MOCK = parseBoolean(import.meta.env?.VITE_USE_MOCK || 'false');
const DEBUG_MODE = parseBoolean(import.meta.env?.VITE_DEBUG_MODE || 'true');
const ANALYTICS = parseBoolean(import.meta.env?.VITE_ANALYTICS || 'false');

// API keys
const OPENAI_API_KEY = import.meta.env?.VITE_OPENAI_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env?.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';
const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || '';

// Running environment output
if (IS_DEV) {
  console.log('Running in development mode');
}

/**
 * Get the environment configuration
 */
export function getEnv() {
  const env = {
    apiUrl: import.meta.env?.VITE_API_URL || '',
    supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    useMock: parseBoolean(import.meta.env?.VITE_USE_MOCK || 'false'),
    isDev: import.meta.env?.MODE === 'development',
    isProd: import.meta.env?.MODE === 'production',
    isTest: import.meta.env?.MODE === 'test',
    apiBaseUrl: API_BASE_URL,
    model: MODEL,
    aiProvider: AI_PROVIDER,
    debugMode: DEBUG_MODE,
    analytics: ANALYTICS,
    openaiApiKey: OPENAI_API_KEY,
    googleApiKey: GOOGLE_API_KEY,
    googleClientId: GOOGLE_CLIENT_ID,
    geminiApiKey: GEMINI_API_KEY,
    hasOpenaiApiKey: !!OPENAI_API_KEY,
    hasGoogleApiKey: !!GOOGLE_API_KEY,
    hasGoogleClientId: !!GOOGLE_CLIENT_ID,
    hasGeminiApiKey: !!GEMINI_API_KEY,
  };

  // Environment variables check
  console.log('Environment Configuration:');
  console.log('-------------------------');
  console.log('API URL:', env.apiUrl);
  console.log('API Base URL:', env.apiBaseUrl);
  console.log('OpenAI Model:', env.model);
  console.log('AI Provider:', env.aiProvider);
  console.log('Mock Mode:', env.useMock);
  console.log('Debug Mode:', env.debugMode);
  console.log('Analytics:', env.analytics);
  console.log('-------------------------');

  // API keys check 
  if (env.hasGoogleApiKey && !env.googleApiKey.startsWith('AIza')) {
    console.warn('Invalid Google API key format. Key should start with "AIza".');
    env.useMock = true;
  } 

  return env;
}

// Environment configuration interface
export interface EnvConfig {
  // API Keys
  OPENAI_API_KEY: string;
  GOOGLE_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GEMINI_API_KEY: string;

  // AI Configuration
  OPENAI_MODEL_NAME: string;
  OPENAI_MAX_TOKENS: number;
  AI_MODEL: string;
  AI_PROVIDER: 'google' | 'openai' | 'claude';
  AI_ASSISTANT_PROVIDER: string;
  AI_AGENT_PROVIDER: string;
  
  // Feature Flags
  USE_MOCK: boolean;
  ENABLE_ANALYTICS: boolean;
  DEBUG_MODE: boolean;
  ENABLE_CLAUDE: boolean;
  ENABLE_XAI: boolean;
  ENABLE_DEEPSEEK: boolean;
  
  // App Configuration
  APP_NAME: string;
  API_URL: string;
  API_BASE_URL: string;
  
  // Utility methods
  logEnv(): void;
}

// Environment variables
export const ENV: EnvConfig = {
  // API Keys
  OPENAI_API_KEY: OPENAI_API_KEY,
  GOOGLE_API_KEY: GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
  GEMINI_API_KEY: GEMINI_API_KEY,
  
  // AI Configuration
  OPENAI_MODEL_NAME: MODEL,
  OPENAI_MAX_TOKENS: 500, // Assuming a default value
  AI_MODEL: 'gemini-2.0-flash',
  AI_PROVIDER: 'google' as 'google' | 'openai' | 'claude',
  AI_ASSISTANT_PROVIDER: 'google', // Assuming a default value
  AI_AGENT_PROVIDER: 'google', // Assuming a default value
  
  // Feature Flags
  USE_MOCK: USE_MOCK,
  ENABLE_ANALYTICS: ANALYTICS,
  DEBUG_MODE: DEBUG_MODE,
  ENABLE_CLAUDE: false, // Assuming a default value
  ENABLE_XAI: false, // Assuming a default value
  ENABLE_DEEPSEEK: false, // Assuming a default value
  
  // App Configuration
  APP_NAME: 'GenieFlowAI', // Assuming a default value
  API_URL: API_URL,
  API_BASE_URL: API_BASE_URL,
  
  // Log the environment configuration
  logEnv: function() {
    if (IS_DEV) {
      console.log('Environment Configuration:');
      console.log('-------------------------');
      console.log(`API URL: ${this.API_URL}`);
      console.log(`API Base URL: ${this.API_BASE_URL}`);
      console.log(`OpenAI Model: ${this.OPENAI_MODEL_NAME}`);
      console.log(`AI Provider: ${this.AI_PROVIDER}`);
      console.log(`Mock Mode: ${this.USE_MOCK}`);
      console.log(`Debug Mode: ${this.DEBUG_MODE}`);
      console.log(`Analytics: ${this.ENABLE_ANALYTICS}`);
      console.log('-------------------------');
    }
  }
};

// Log the environment on load
ENV.logEnv();

// Add debug logging
if (IS_DEV) {
  console.log('Environment variables:', {
    hasGoogleApiKey: !!ENV.GOOGLE_API_KEY,
    hasGoogleClientId: !!ENV.GOOGLE_CLIENT_ID,
    hasGeminiApiKey: !!ENV.GEMINI_API_KEY,
    aiProvider: ENV.AI_PROVIDER,
    useMock: ENV.USE_MOCK
  });
}

// Validate Google API keys
if (!ENV.GOOGLE_API_KEY || !ENV.GOOGLE_CLIENT_ID || !ENV.GEMINI_API_KEY) {
  console.warn('Missing required Google API configuration. Some features may not work properly.');
  ENV.USE_MOCK = true;
} else if (ENV.GOOGLE_API_KEY && !ENV.GOOGLE_API_KEY.startsWith('AIza')) {
  console.warn('Invalid Google API key format. Key should start with "AIza".');
  ENV.USE_MOCK = true;
} 