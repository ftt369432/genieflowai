import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAIStore } from '../store/aiStore';
import { useNotifications } from './useNotifications';
import type { AIConfig, AIModel, Message, DocumentReference } from '../types/ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

export type AIProvider = 'openai' | 'gemini' | 'anthropic';

interface AIState extends AIConfig {
  provider: AIProvider;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotifications();
  const [config, setConfig] = useState<AIState>({
    provider: 'gemini',
    model: 'gemini-pro'
  });

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  // Debug logging for API key
  if (import.meta.env.DEV) {
    console.log('Gemini API Key:', {
      exists: !!import.meta.env.VITE_GEMINI_API_KEY,
      length: import.meta.env.VITE_GEMINI_API_KEY?.length,
      startsWithAIza: import.meta.env.VITE_GEMINI_API_KEY?.startsWith('AIza')
    });
  }

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const testGeminiConnection = useCallback(async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('Testing Gemini connection...');
      const result = await model.generateContent('Hello! This is a test message. Please respond with "Connection successful!"');
      const response = await result.response;
      console.log('Gemini test response:', response.text());
      return true;
    } catch (error: any) {
      console.error('Gemini test failed:', {
        message: error.message,
        details: error.details,
        status: error.status
      });
      return false;
    }
  }, [genAI]);

  // Test the connection immediately in development
  if (import.meta.env.DEV) {
    testGeminiConnection();
  }

  const formatContextForProvider = (
    context: DocumentReference[] | undefined,
    provider: AIProvider
  ): string => {
    if (!context || context.length === 0) return '';

    const formattedContext = context
      .map(doc => `${doc.title}:\n${doc.excerpt}`)
      .join('\n\n');

    switch (provider) {
      case 'openai':
        return `Context:\n${formattedContext}\n\nBased on the above context, `;
      case 'gemini':
        return `Here is some relevant context:\n${formattedContext}\n\nUsing this context, `;
      case 'anthropic':
        return `Given this context:\n${formattedContext}\n\nWith this information in mind, `;
      default:
        return `Context:\n${formattedContext}\n\n`;
    }
  };

  const sendMessage = useCallback(async (
    content: string,
    options?: Partial<AIConfig>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const mergedConfig = { ...config, ...options };
      const contextPrefix = formatContextForProvider(mergedConfig.context, mergedConfig.provider);
      const fullContent = contextPrefix + content;

      switch (mergedConfig.provider) {
        case 'openai':
          const messages: ChatCompletionMessageParam[] = [];
          if (mergedConfig.systemPrompt) {
            messages.push({ 
              role: 'system', 
              content: mergedConfig.systemPrompt 
            });
          }
          messages.push({ 
            role: 'user', 
            content: fullContent 
          });

          const completion = await openai.chat.completions.create({
            messages,
            model: mergedConfig.model,
            temperature: mergedConfig.temperature,
            max_tokens: mergedConfig.maxTokens,
          });
          return completion.choices[0].message.content;

        case 'gemini':
          // Debug logging for Gemini request
          if (import.meta.env.DEV) {
            console.log('Gemini Request:', {
              model: "gemini-pro",
              content: fullContent.slice(0, 100) + '...',
              temperature: mergedConfig.temperature,
              maxOutputTokens: mergedConfig.maxTokens
            });
          }

          const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
              temperature: mergedConfig.temperature,
              maxOutputTokens: mergedConfig.maxTokens,
            }
          });

          try {
            const result = await model.generateContent(fullContent);
            const response = await result.response;
            return response.text();
          } catch (geminiError: any) {
            console.error('Gemini API Error:', {
              message: geminiError.message,
              details: geminiError.details,
              status: geminiError.status,
              stack: geminiError.stack
            });
            throw geminiError;
          }

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
  }, [config, openai, genAI, showError]);

  const updateConfig = useCallback((newConfig: Partial<AIState>) => {
    setConfig(current => ({ ...current, ...newConfig }));
  }, []);

  return {
    sendMessage,
    updateConfig,
    config,
    isLoading,
    error,
    testGeminiConnection
  };
} 