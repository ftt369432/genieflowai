/**
 * Environment configuration
 * 
 * Centralizes access to environment variables with proper defaults
 */

export type EnvironmentConfig = {
  useMock: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  serverUrl: string;
  apiUrl: string;
  googleClientId: string;
  environment: string;
  debugMode: boolean;
  analytics: boolean;
  hasOpenaiApiKey: boolean;
  hasGoogleApiKey: boolean;
  hasGoogleClientId: boolean;
  hasGeminiApiKey: boolean;
  openaiApiKey: string;
  googleApiKey: string;
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiModel: string;
}

/**
 * Helper to parse boolean strings
 */
function parseBoolean(value: string): boolean {
  return value === 'true' || value === '1';
}

/**
 * Get environment configuration
 */
export function getEnv(): EnvironmentConfig {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Force mock mode to false in production
  const useMock = isProduction ? false : parseBoolean(import.meta.env?.VITE_USE_MOCK || 'false');
  
  // Debug and analytics flags
  const debugMode = isProduction ? false : parseBoolean(import.meta.env?.VITE_DEBUG_MODE || 'true');
  const analytics = parseBoolean(import.meta.env?.VITE_ANALYTICS || 'false');
  
  // API keys
  const openaiApiKey = import.meta.env?.VITE_OPENAI_API_KEY || '';
  const googleApiKey = import.meta.env?.VITE_GOOGLE_API_KEY || '';
  const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';
  const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
  
  // URLs
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
  
  // AI configuration
  const aiModel = import.meta.env?.VITE_AI_MODEL || 'gemini-2.0-flash';
  
  if (!googleClientId && !useMock) {
    console.warn('Google Client ID not set in environment variables. Some features may not work properly.');
  }
  
  return {
    useMock,
    isDevelopment,
    isProduction,
    serverUrl,
    apiUrl,
    googleClientId,
    environment,
    debugMode,
    analytics,
    hasOpenaiApiKey: !!openaiApiKey,
    hasGoogleApiKey: !!googleApiKey,
    hasGoogleClientId: !!googleClientId,
    hasGeminiApiKey: !!geminiApiKey,
    openaiApiKey,
    googleApiKey,
    geminiApiKey,
    supabaseUrl,
    supabaseAnonKey,
    aiModel
  };
} 