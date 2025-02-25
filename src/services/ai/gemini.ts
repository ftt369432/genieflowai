import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService } from './baseAIService';
import type { Message } from '../../types/ai';

export class GeminiService extends BaseAIService {
  private client: GoogleGenerativeAI;

  constructor() {
    super('gemini');
    const apiKey = this.getApiKey('gemini');
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(messages[messages.length - 1].content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.handleError(error, 'Gemini');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage([{ role: 'user', content: 'test', id: '1', timestamp: new Date() }]);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const geminiService = new GeminiService(); 