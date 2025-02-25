import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { useAIStore } from '../store/aiStore';
import { useNotifications } from './useNotifications';
import type { AIModel, Message } from '../types/ai';

export type AIProvider = 'openai' | 'gemini' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotifications();
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    model: 'gpt-4-turbo-preview'
  });

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const sendMessage = useCallback(async (
    content: string,
    options?: Partial<AIConfig>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedConfig = { ...config, ...options };

      switch (mergedConfig.provider) {
        case 'openai':
          const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content }],
            model: mergedConfig.model,
            temperature: mergedConfig.temperature,
            max_tokens: mergedConfig.maxTokens,
          });
          return completion.choices[0].message.content;

        case 'gemini':
          // Implement Gemini API call
          throw new Error('Gemini integration not implemented');

        case 'anthropic':
          // Implement Claude/Anthropic API call
          throw new Error('Anthropic integration not implemented');

        default:
          throw new Error(`Unsupported AI provider: ${mergedConfig.provider}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config, openai, showError]);

  const updateConfig = useCallback((newConfig: Partial<AIConfig>) => {
    setConfig(current => ({ ...current, ...newConfig }));
  }, []);

  return {
    sendMessage,
    updateConfig,
    config,
    isLoading,
    error
  };
} 