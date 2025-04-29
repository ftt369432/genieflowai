import { useCallback } from 'react';
import { geminiService } from '../services/ai/gemini';
import { AIMessage } from '../types/ai';

export function useAIProvider() {
  const getCompletion = useCallback(async (prompt: string): Promise<string> => {
    try {
      return await geminiService.getCompletion(prompt);
    } catch (error) {
      console.error('Error in getCompletion:', error);
      throw error;
    }
  }, []);

  const chat = useCallback(async (messages: AIMessage[]): Promise<string> => {
    try {
      const response = await geminiService.chat(messages);
      return response.content;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }, []);

  return {
    getCompletion,
    chat
  };
} 