import { useCallback, useState } from 'react';
import type { AIModel } from '../types/ai';
import { geminiSimplifiedService } from '../services/gemini-simplified';
import { getEnv } from '../config/env';

// Define default model for Gemini
const defaultGeminiModel: AIModel = {
  id: 'gemini-1.5-flash',
  name: 'Gemini 1.5 Flash',
  provider: 'google',
  capabilities: ['chat', 'text-generation'],
  contextSize: 32000
};

export function useAIProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Always use Google Gemini as the provider
  const defaultProvider = 'google';
  
  const sendMessage = useCallback(async (content: string, modelId?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our simplified Gemini service to ensure compatibility
      const response = await geminiSimplifiedService.getCompletion(content, {
        model: modelId || defaultGeminiModel.id
      });
      return response;
    } catch (error) {
      console.error('Error in useAIProvider:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error
  };
} 