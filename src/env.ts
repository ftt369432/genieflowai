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

// Process environment variables
const processEnv = {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: process.env.VITE_API_URL,
  port: process.env.VITE_PORT ? Number(process.env.VITE_PORT) : undefined,
  useMock: process.env.VITE_USE_MOCK === 'true',
  aiProvider: process.env.VITE_AI_PROVIDER,
  aiModel: process.env.VITE_AI_MODEL,
  geminiApiKey: process.env.VITE_GEMINI_API_KEY,
  googleClientId: process.env.VITE_GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET,
  hasGeminiApiKey: process.env.VITE_GEMINI_API_KEY ? true : false,
  debug: process.env.VITE_DEBUG === 'true',
};

// Parse and validate environment variables
export const env = envSchema.parse(processEnv);

// Type export for TypeScript consumption
export type Env = z.infer<typeof envSchema>;