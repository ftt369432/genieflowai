import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Node environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  // API settings
  apiUrl: z.string().url().optional(),
  port: z.number().default(3000),
  
  // AI Configuration
  useMock: z.boolean().default(false),
  aiProvider: z.enum(['google']).default('google'),
  aiModel: z.string().default('gemini-2.0-flash'),
  
  // API Keys
  geminiApiKey: z.string().optional(),
  
  // Google OAuth
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  
  // Other settings
  hasGeminiApiKey: z.boolean().default(false),
  debug: z.boolean().default(false)
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const env = {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.VITE_API_URL,
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
    useMock: process.env.VITE_USE_MOCK === 'true',
    aiProvider: 'google', // Always use Google Gemini
    aiModel: process.env.VITE_AI_MODEL || 'gemini-2.0-flash',
    geminiApiKey: process.env.VITE_GEMINI_API_KEY,
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    hasGeminiApiKey: !!process.env.VITE_GEMINI_API_KEY,
    debug: process.env.VITE_DEBUG_MODE === 'true'
  };

  return envSchema.parse(env);
}