import { useState } from 'react';
import { openAIService } from '../services/ai/openai';
import { mockOpenAIService } from '../services/ai/mockOpenAI';

export function useChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = process.env.VITE_OPENAI_API_KEY ? openAIService : mockOpenAIService;

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.getCompletion(message);
      setMessages(prev => [...prev, message, response]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
} 