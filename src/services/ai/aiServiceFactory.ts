import { OpenAIService } from './openai';
import type { AIService } from './baseAIService';

export class AIServiceFactory {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!this.instance) {
      this.instance = new OpenAIService();
    }
    return this.instance;
  }
} 