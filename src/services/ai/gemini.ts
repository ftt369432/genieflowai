import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './aiServiceFactory';
import type { Message } from '../../types/ai';
import { getEnv } from '../../config/env';

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor() {
    try {
      console.log('Initializing GeminiService...');
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found in environment variables');
      }
      
      console.log('Got API key successfully');
      
      this.client = new GoogleGenerativeAI(apiKey);
      console.log('GoogleGenerativeAI client created successfully');
      
      // Get the configured Gemini model from environment, or fallback to gemini-2.0-flash
      const env = getEnv();
      this.defaultModel = env.model || 'gemini-2.0-flash';
      
      console.log(`Initialized Gemini service with model: ${this.defaultModel}`);
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      throw error;
    }
  }

  /**
   * Generate text from a prompt
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in Gemini generateText:', error);
      return this.handleError(error);
    }
  }

  /**
   * Generate a chat response from a series of messages
   */
  async generateChatResponse(messages: any[]): Promise<string> {
    try {
      // Format messages in a way Gemini can understand
      const formattedContent = this.formatMessagesForGemini(messages);
      
      const model = this.client.getGenerativeModel({ 
        model: this.defaultModel
      });
      
      const result = await model.generateContent(formattedContent);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in Gemini generateChatResponse:', error);
      return this.handleError(error);
    }
  }

  /**
   * Create embeddings from text
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Use the embedding model
      const model = this.client.getGenerativeModel({
        model: 'embedding-001',
      });
  
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;
      return embedding;
    } catch (error) {
      console.error('Error in Gemini createEmbedding:', error);
      return this.handleError(error);
    }
  }

  /**
   * Format messages for Gemini
   */
  private formatMessagesForGemini(messages: any[]): string {
    // For simple implementation, just convert to a conversation format
    return messages.map(msg => {
      const role = typeof msg === 'string' ? 'user' : (msg.role || 'user');
      const content = typeof msg === 'string' ? msg : (msg.content || '');
      return `${role === 'user' ? 'Human' : 'Assistant'}: ${content}`;
    }).join('\n\n') + '\n\nAssistant:';
  }

  /**
   * Handle errors
   */
  private handleError(error: any): string {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Gemini service error:', errorMessage);
    return `I encountered an error processing your request. Please try again later. (Error: ${errorMessage})`;
  }
} 