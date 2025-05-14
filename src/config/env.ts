/**
 * Environment configuration
 * Loads environment variables and provides a typed interface
 */

// Environment configuration type
export interface EnvironmentConfig {
  useMock: boolean | 'hybrid'; // Re-adding useMock with support for hybrid mode
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
  // AI-related configurations
  aiProvider: 'google' | 'xai' | 'deepseek' | 'gemini';
  aiModel: string;
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
  debug: boolean;
  // Model settings
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  // Node environment
  nodeEnv: string;
  // Hybrid mode settings
  enableLiveData: boolean;
  enableMockData: boolean;
}

// Default AI provider
const DEFAULT_AI_PROVIDER = 'gemini';

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
  
  // ############ DEBUG LOGGING START ############
  console.error(
    '[DEBUG_ENV_TS] VITE_USE_MOCK raw value:',
    import.meta.env.VITE_USE_MOCK,
    '| type:',
    typeof import.meta.env.VITE_USE_MOCK
  );
  // ############ DEBUG LOGGING END ############

  // Set up the base URL depending on environment
  const baseUrl = isDevelopment
    ? 'http://localhost:3000'
    : 'https://genieflowai.netlify.app';

  // Set up the auth callback URL
  const authCallbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || 
    (isDevelopment
      ? `${baseUrl}/auth/callback`
      : 'https://genieflowai.netlify.app/auth/callback');

  // Create the environment config
  environmentConfig = {
    useMock: import.meta.env.VITE_USE_MOCK === 'true' ? true : import.meta.env.VITE_USE_MOCK === 'hybrid' ? 'hybrid' : false,
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
    // AI-related configurations
    aiProvider: DEFAULT_AI_PROVIDER,
    aiModel: import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash',
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    hasGeminiApiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
    debug: import.meta.env.VITE_DEBUG_MODE === 'true',
    // Model settings
    maxTokens: import.meta.env.VITE_MAX_TOKENS ? Number(import.meta.env.VITE_MAX_TOKENS) : undefined,
    temperature: import.meta.env.VITE_TEMPERATURE ? Number(import.meta.env.VITE_TEMPERATURE) : undefined,
    topP: import.meta.env.VITE_TOP_P ? Number(import.meta.env.VITE_TOP_P) : undefined,
    topK: import.meta.env.VITE_TOP_K ? Number(import.meta.env.VITE_TOP_K) : undefined,
    // Node environment
    nodeEnv: import.meta.env.NODE_ENV || '',
    // Hybrid mode settings
    enableLiveData: import.meta.env.VITE_ENABLE_LIVE_DATA === 'true',
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
  };

  return environmentConfig;
}

/**
 * Update the environment configuration 
 * Used for runtime configuration updates
 */
export function updateEnvConfig(updates: Partial<EnvironmentConfig>): void {
  if (environmentConfig) {
    environmentConfig = { ...environmentConfig, ...updates };
  }
}