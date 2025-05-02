import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService } from './baseAIService';
import type { Message } from '../../types/ai';
import { getEnv } from '../../config/env';

export class GeminiService extends BaseAIService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-2.0-flash';

  constructor() {
    super('google');
    try {
      const env = getEnv();
      const apiKey = env.geminiApiKey;
      this.client = new GoogleGenerativeAI(apiKey);
      console.log('GeminiService initialized with model:', this.defaultModel);
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      throw error;
    }
  }

  async generateResponse(messages: Message[]): Promise<string> {
    try {
      // Combine multiple messages into a single context
      const combinedMessage = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const result = await this.getCompletion(combinedMessage);
      return result;
    } catch (error) {
      throw this.handleError(error, 'Gemini generateResponse');
    }
  }

  // Make sendMessage public to match BaseAIService
  public async sendMessage(message: Message): Promise<Message> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95
        }
      });
      
      const result = await model.generateContent(message.content);
      const response = await result.response;
      const text = response.text();
      
      if (!text) throw new Error('Empty response from Gemini');

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };
    } catch (error) {
      throw this.handleError(error, 'Gemini');
    }
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
  }): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 2048,
          temperature: options?.temperature || 0.7,
          stopSequences: options?.stopSequences,
          topK: 40,
          topP: 0.95
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '';
    } catch (error) {
      throw this.handleError(error, 'Gemini');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: 'embedding-001',
        generationConfig: {
          temperature: 0
        }
      });

      const embedResult = await model.embedContent(text);
      // Convert embedding to array of numbers
      const values = Object.values(embedResult.embedding);
      return values.map(v => Number(v));
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw this.handleError(error, 'Gemini Embedding');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage = 'Test connection to Gemini 2.0 Flash';
      const response = await this.getCompletion(testMessage, { temperature: 0.1 });
      return response.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    if (error instanceof Error) {
      throw new Error(`${service} Error: ${error.message}`);
    }
    throw new Error(`${service} Error: Unknown error occurred`);
  }
}

export const geminiService = new GeminiService();