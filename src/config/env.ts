/**
 * Environment configuration
 * Loads environment variables and provides a typed interface
 */

// Environment configuration type
export interface EnvironmentConfig {
  useMock: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  serverUrl: string;
  apiUrl: string;
  googleApiKey: string;
  googleClientId: string;
  googleScopes: string[];
  authCallbackUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Cache for the environment config
let environmentConfig: EnvironmentConfig | null = null;

/**
 * Get the environment configuration
 */
export function getEnv(): EnvironmentConfig {
  // If we've already loaded the config, return it
  if (environmentConfig) {
    return environmentConfig;
  }

  // Determine the environment
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';
  
  // Determine whether to use mock data
  const useMock = import.meta.env.VITE_USE_MOCK === 'true' || 
                 import.meta.env.VITE_USE_MOCK === true ||
                 import.meta.env.VITE_USE_MOCK === '1';

  // Set up the base URL depending on environment
  const baseUrl = isDevelopment
    ? 'http://localhost:3000'
    : 'https://genieflowai.netlify.app';

  // Set up the auth callback URL - use the environment variable if available, otherwise use default
  const authCallbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || 
    (isDevelopment
      ? `${baseUrl}/auth/callback`
      : 'https://genieflowai.netlify.app/auth/callback');

  // Create the environment config
  environmentConfig = {
    useMock,
    isDevelopment,
    isProduction,
    serverUrl: baseUrl,
    apiUrl: `${baseUrl}/api`,
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    googleScopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    authCallbackUrl,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };

  return environmentConfig;
}

/**
 * Update the environment configuration 
 * Used to force mock mode when provider token is missing
 */
export function updateEnvConfig(updates: Partial<EnvironmentConfig>): void {
  if (environmentConfig) {
    environmentConfig = { ...environmentConfig, ...updates };
  }
} 