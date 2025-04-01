import { useCallback, useState, useEffect } from 'react';
import type { AIModel } from '../types/ai';
import { OpenAIService } from '../services/openai.ts';
import { geminiService } from '../services/gemini';
import { ClaudeService } from '../services/claude.ts';
import { getEnv } from '../config/env';

// Define default model for Gemini
const defaultGeminiModel: AIModel = {
  id: 'gemini-2.0-flash',
  name: 'Gemini 2.0 Flash',
  provider: 'google',
  capabilities: ['chat', 'text-generation'],
  contextSize: 32000
};

export function useAIProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<string>('google');
  
  useEffect(() => {
    // Get the configured AI provider from environment
    const env = getEnv();
    setDefaultProvider(env.aiProvider || 'google');
  }, []);

  const sendMessage = useCallback(async (content: string, model: AIModel = defaultGeminiModel) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = model.provider || defaultProvider;
      
      switch (provider) {
        case 'google':
          return geminiService.sendMessage(content, model.id);
        case 'openai':
          return OpenAIService.sendMessage(content, model.id);
        case 'anthropic':
          return ClaudeService.sendMessage(content);
        default:
          // Fallback to Google if provider is unknown
          console.log(`Unknown provider '${provider}', falling back to Google Gemini`);
          return geminiService.sendMessage(content, model.id);
      }
    } catch (error) {
      console.error('Error in useAIProvider:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [defaultProvider]);

  return {
    sendMessage,
    isLoading,
    error
  };
} 