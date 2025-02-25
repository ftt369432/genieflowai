import { useCallback, useState } from 'react';
import type { AIModel } from '../types/ai';
import { OpenAIService } from '../services/openai.ts';
import { geminiService } from '../services/gemini';
import { ClaudeService } from '../services/claude.ts';

export function useAIProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, model: AIModel) => {
    switch (model.provider) {
      case 'openai':
        return OpenAIService.sendMessage(content, model.id);
      case 'google':
        return geminiService.sendMessage(content);
      case 'anthropic':
        return ClaudeService.sendMessage(content);
      default:
        throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error
  };
} 