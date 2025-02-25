import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService } from './ai/baseAIService';

class GeminiService extends BaseAIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    super();
    const apiKey = this.getGeminiKey();
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async testConnection() {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Test connection');
      const response = await result.response;
      return response.text();
    } catch (error) {
      return this.handleError(error, 'Gemini');
    }
  }

  async sendMessage(content: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return this.handleError(error, 'Gemini');
    }
  }
}

export const geminiService = new GeminiService(); 