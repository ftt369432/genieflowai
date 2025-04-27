/**
 * AI Service Factory
 * 
 * Creates appropriate AI service based on configuration
 */

import { GeminiService } from './gemini';
import { MockAIService } from './mockAI';
import { getEnv } from '../../config/env';

export enum AIProvider {
  Google = 'google',
  Mock = 'mock'
}

export interface AIService {
  generateText: (prompt: string) => Promise<string>;
  generateChatResponse: (messages: any[]) => Promise<string>;
  createEmbedding: (text: string) => Promise<number[]>;
}

/**
 * Create an AI service based on configuration
 */
export function createAIService(provider?: AIProvider): AIService {
  const { useMock } = getEnv();
  const configuredProvider = provider || import.meta.env.VITE_AI_PROVIDER as AIProvider || AIProvider.Google;
  
  // Always use mock if configured
  if (useMock) {
    console.log('Using Mock AI Service');
    return new MockAIService();
  }

  // Otherwise use the configured provider
  switch (configuredProvider) {
    case AIProvider.Google:
      console.log('Using Google Gemini Service');
      return new GeminiService();
    default:
      console.log('Falling back to Google Gemini Service');
      return new GeminiService();
  }
} 