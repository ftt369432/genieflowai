import type { AIModel } from '../types/ai';

export interface AIProvider {
  id: string;
  name: string;
  apiKeyName: string;
  enabled: boolean;
  models?: string[];
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  debug?: boolean;
}

export const defaultProvider = 'google';

export const aiProviders = [
  {
    id: 'google',
    name: 'Google Gemini',
    apiKeyName: 'VITE_GEMINI_API_KEY',
    enabled: true,
    models: [
      'gemini-2.0-flash',          // Default model - Fastest, most efficient
      'gemini-2.0-pro',            // Most capable
      'gemini-2.0-flash-lite',     // Lightweight alternative
      'gemini-1.5-pro',            // Legacy support
      'embedding-001'              // Embeddings model
    ],
    defaultModel: 'gemini-2.0-flash',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.95,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  }
];