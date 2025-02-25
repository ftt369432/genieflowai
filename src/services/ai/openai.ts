import OpenAI from 'openai';
import { ENV } from '../../config/env';
import type { AIService } from './baseAIService';
import { MockOpenAIService } from './mockOpenAI';

export class OpenAIService implements AIService {
  private client: any;
  
  constructor() {
    // Debug log
    console.log('Initializing OpenAI service');
    console.log('API Key format check:', {
      hasKey: !!ENV.OPENAI_API_KEY,
      keyLength: ENV.OPENAI_API_KEY?.length,
      keyStart: ENV.OPENAI_API_KEY?.substring(0, 8),
      hasProjectId: !!ENV.OPENAI_PROJECT_ID,
      hasOrgId: !!ENV.OPENAI_ORG_ID,
      isProjectKey: ENV.OPENAI_API_KEY?.startsWith('sk-proj-')
    });
    
    if (ENV.OPENAI_API_KEY) {
      // Use the actual OpenAI client if the API key is present
      this.client = new OpenAI({
        apiKey: ENV.OPENAI_API_KEY,
        organization: ENV.OPENAI_ORG_ID,
        dangerouslyAllowBrowser: true,
      });
    } else {
      // Use the mock service if no API key is provided
      this.client = new MockOpenAIService();
    }
  }

  async getCompletion(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}) {
    return this.client.getCompletion(prompt, options);
  }

  async getEmbedding(text: string) {
    return this.client.getEmbedding(text);
  }
}

// Create a singleton instance
export const openAIService = new OpenAIService(); 