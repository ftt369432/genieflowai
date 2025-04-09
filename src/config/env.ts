/**
 * Environment configuration
 * Loads environment variables and provides a typed interface
 */

interface EnvironmentConfig {
  useMock: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  serverUrl: string;
  apiUrl: string;
  geminiApiKey: string;
  googleApiKey: string;
  authCallbackUrl: string;
  aiProvider: 'google';
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Cache the environment config
let environmentConfig: EnvironmentConfig | null = null;

/**
 * Get the environment configuration
 */
export function getEnv(): EnvironmentConfig {
  if (environmentConfig) {
    return environmentConfig;
  }

  // Determine environment
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';
  
  // Determine if we should use mock data - handle both string and boolean values
  const useMock = import.meta.env.VITE_USE_MOCK === 'true' || 
                 import.meta.env.VITE_USE_MOCK === true;
  
  // Get API URL with fallback
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Get server URL with fallback
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  
  // Get Gemini API key with fallback
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  // Get Google API key with fallback
  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  
  // Determine auth callback URL - automatically detect local vs production
  const isLocalEnvironment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  let authCallbackUrl = '';
  if (isLocalEnvironment) {
    // Use local URL when running locally
    authCallbackUrl = `${window.location.origin}/auth/callback`;
  } else {
    // Use Netlify URL in production
    authCallbackUrl = 'https://genieflowai.netlify.app/auth/callback';
  }
  
  // Get AI provider with fallback
  const aiProvider = (import.meta.env.VITE_AI_PROVIDER || 'google') as 'google';
  
  // Get Supabase URL and anon key with fallbacks
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  // Create and cache environment config
  environmentConfig = {
    useMock,
    isDevelopment,
    isProduction,
    serverUrl,
    apiUrl,
    geminiApiKey,
    googleApiKey,
    authCallbackUrl,
    aiProvider,
    supabaseUrl,
    supabaseAnonKey,
  };
  
  return environmentConfig;
} 