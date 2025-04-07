import { OpenAIService } from './openai';
import { geminiSimplifiedService } from '../gemini-simplified';
import type { AIService } from './baseAIService';
import { getEnv } from '../../config/env';

export class AIServiceFactory {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!this.instance) {
      const env = getEnv();
      
      // Always use Gemini as the default provider
      // Use type assertion to avoid compatibility issues between different AIService interfaces
      this.instance = geminiSimplifiedService as unknown as AIService;
      
      console.log(`AIServiceFactory initialized with provider: ${env.aiProvider}`);
    }
    return this.instance;
  }
} 