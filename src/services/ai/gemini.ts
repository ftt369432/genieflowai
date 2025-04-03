import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService } from './baseAIService';
import type { Message, AIModel } from '../../types/ai';
import { getEnv } from '../../config/env';
import { ResponseWithSources, Source } from '../AIService';
import { Task } from '../../types/task';
import { Event } from '../../types/calendar';

export class GeminiService extends BaseAIService {
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor() {
    try {
      console.log('Initializing GeminiService...');
      super('google');
      console.log('BaseAIService initialized successfully');
      
      const apiKey = this.getApiKey('google');
      console.log('Got API key successfully');
      
      this.client = new GoogleGenerativeAI(apiKey);
      console.log('GoogleGenerativeAI client created successfully');
      
      // Get the configured Gemini model from environment, or fallback to gemini-2.0-flash
      const env = getEnv();
      console.log('Environment config:', { 
        model: env.model, 
        aiProvider: env.aiProvider,
        hasGeminiApiKey: env.hasGeminiApiKey
      });
      
      this.defaultModel = env.model || 'gemini-2.0-flash';
      
      console.log(`Initialized Gemini service with model: ${this.defaultModel}`);
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      throw error;
    }
  }

  async sendMessage(message: Message): Promise<Message> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel
      });
      
      const result = await model.generateContent(message.content);
      const response = await result.response;
      const responseText = response.text();
      
      // Return a message object
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        metadata: {
          model: this.defaultModel,
          provider: 'google'
        }
      };
    } catch (error) {
      console.error('Error in Gemini sendMessage:', error);
      throw error;
    }
  }

  async generateResponse(messages: Message[]): Promise<string> {
    try {
      // Take the last message from the array
      const lastMessage = messages[messages.length - 1];
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel
      });
      
      const result = await model.generateContent(lastMessage.content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in Gemini generateResponse:', error);
      return this.handleError(error, 'Gemini');
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
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
          stopSequences: options?.stopSequences
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return this.handleError(error, 'Gemini');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      // The GoogleGenerativeAI embedding API might be different
      // For now, we'll return a mock embedding
      console.warn('Gemini embedding is not fully implemented - returning mock data');
      
      // Generate a deterministic mock embedding based on the input text
      const mockEmbedding = new Array(128).fill(0).map((_, i) => {
        // Use a simple hash of the text + position to get a consistent value
        const hashCode = (text.charCodeAt(Math.min(i, text.length - 1)) + i) / 255;
        return Math.sin(hashCode) * 0.5 + 0.5; // Value between 0 and 1
      });
      
      return mockEmbedding;
    } catch (error) {
      return this.handleError(error, 'Gemini Embedding');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Hello, this is a test message',
        timestamp: new Date()
      };
      
      await this.sendMessage(testMessage);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService(); 