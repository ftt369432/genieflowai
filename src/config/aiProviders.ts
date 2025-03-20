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

export const defaultProvider = 'openai';

export const aiProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyName: 'VITE_OPENAI_API_KEY',
    enabled: true,
    models: ['gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 2048,
    temperature: 0.7
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyName: 'VITE_GEMINI_API_KEY',
    enabled: true,
    models: ['gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-pro',
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