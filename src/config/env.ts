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
  
  // Email Testing Configuration
  VITE_EMAIL_TEST_MODE: boolean;
  VITE_EMAIL_TEST_ACCOUNT: string;
  VITE_EMAIL_TEST_PASSWORD: string;
  VITE_EMAIL_TEST_IMAP_SERVER: string;
  VITE_EMAIL_TEST_IMAP_PORT: number;
  VITE_EMAIL_TEST_SMTP_SERVER: string;
  VITE_EMAIL_TEST_SMTP_PORT: number;
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

  // Set up the auth callback URL
  const authCallbackUrl = isDevelopment
    ? `${baseUrl}/auth/callback`
    : 'https://genieflowai.netlify.app/auth/callback';

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
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Email Testing Configuration
    VITE_EMAIL_TEST_MODE: import.meta.env.VITE_EMAIL_TEST_MODE === 'true' || 
                       import.meta.env.VITE_EMAIL_TEST_MODE === true ||
                       import.meta.env.VITE_EMAIL_TEST_MODE === '1',
    VITE_EMAIL_TEST_ACCOUNT: import.meta.env.VITE_EMAIL_TEST_ACCOUNT || '',
    VITE_EMAIL_TEST_PASSWORD: import.meta.env.VITE_EMAIL_TEST_PASSWORD || '',
    VITE_EMAIL_TEST_IMAP_SERVER: import.meta.env.VITE_EMAIL_TEST_IMAP_SERVER || '',
    VITE_EMAIL_TEST_IMAP_PORT: import.meta.env.VITE_EMAIL_TEST_IMAP_PORT ? Number(import.meta.env.VITE_EMAIL_TEST_IMAP_PORT) : 0,
    VITE_EMAIL_TEST_SMTP_SERVER: import.meta.env.VITE_EMAIL_TEST_SMTP_SERVER || '',
    VITE_EMAIL_TEST_SMTP_PORT: import.meta.env.VITE_EMAIL_TEST_SMTP_PORT ? Number(import.meta.env.VITE_EMAIL_TEST_SMTP_PORT) : 0
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