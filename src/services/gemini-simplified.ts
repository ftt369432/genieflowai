import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '../config/env';

export class GeminiSimplifiedService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-2.0-flash';

  constructor() {
    try {
      const env = getEnv();
      const apiKey = env.geminiApiKey;
      this.client = new GoogleGenerativeAI(apiKey);
      this.defaultModel = env.aiModel || this.defaultModel;
    } catch (error) {
      console.error('Error initializing GeminiSimplifiedService:', error);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // Add a getCompletion method that the legalAssistant service expects
  async getCompletion(parts: Array<{text: string} | {inlineData: {mimeType: string, data: string}}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });
      
      // Pass the array of parts to generateContent for multimodal input
      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text() || '';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ model: 'embedding-001' });
      const embedResult = await model.embedContent(text);
      // Directly access the values array from the embedding object
      const values = embedResult.embedding.values;
      if (!values) {
        throw new Error('Embedding values are missing in the response');
      }
      return values;
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }
}

// Export an instance of the class to be used by other services
export const geminiSimplifiedService = new GeminiSimplifiedService();

// Make sure this is also exported as default for compatibility
export default { geminiSimplifiedService };