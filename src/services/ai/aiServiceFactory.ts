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
      
      // Always report as google provider since mock mode is disabled
      console.log(`AIServiceFactory initialized with provider: google (real API mode enabled)`);
      
      // Check if the service is ready
      if (geminiSimplifiedService.isReady && !geminiSimplifiedService.isReady()) {
        console.warn('GeminiSimplifiedService is not properly initialized! AI functionality may be limited.');
      } else {
        console.log('GeminiSimplifiedService is initialized and ready.');
      }
    }
    return this.instance;
  }
} 