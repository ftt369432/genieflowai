export interface AIProvider {
  id: string;
  name: string;
  apiKeyName: string;
  enabled: boolean;
  models?: string[];
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
}

export const defaultProvider = 'google';

export const aiProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyName: 'VITE_OPENAI_API_KEY',
    enabled: false,
    models: ['gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 2048,
    temperature: 0.7
  },
  {
    id: 'google',
    name: 'Google Gemini',
    apiKeyName: 'VITE_GEMINI_API_KEY',
    enabled: true,
    models: [
      'gemini-2.5-pro-exp-03-25',  // Gemini 2.5 Pro Experimental
      'gemini-2.0-flash',          // Gemini 2.0 Flash
      'gemini-2.0-flash-lite',     // Gemini 2.0 Flash-Lite
      'gemini-1.5-flash',          // Gemini 1.5 Flash
      'gemini-1.5-flash-8b',       // Gemini 1.5 Flash-8B
      'gemini-1.5-pro',            // Gemini 1.5 Pro
      'gemini-embedding-exp'       // Gemini Embedding
    ],
    defaultModel: 'gemini-2.0-flash',
    maxTokens: 2048,
    temperature: 0.7
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    apiKeyName: 'VITE_CLAUDE_API_KEY',
    enabled: false,
    maxTokens: 4096,
    temperature: 0.7
  },
  {
    id: 'xai',
    name: 'xAI',
    apiKeyName: 'VITE_XAI_API_KEY',
    enabled: false
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKeyName: 'VITE_DEEPSEEK_API_KEY',
    enabled: false,
    maxTokens: 2048,
    temperature: 0.7
  }
]; 