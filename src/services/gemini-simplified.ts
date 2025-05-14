import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { getEnv } from '../config/env';

export class GeminiSimplifiedService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-1.5-flash-latest';
  private maxRetries = 3;
  private initialDelayMs = 1000;

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

  private async exponentialBackoffRetry<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries,
    delayMs = this.initialDelayMs
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof GoogleGenerativeAIFetchError && error.status === 429) {
        if (retries > 0) {
          console.warn(
            `Gemini API rate limit hit. Retrying in ${delayMs / 1000}s... (${retries} retries left)`
          );
          let actualDelay = delayMs;
          if (error.message) {
            const match = error.message.match(/"retryDelay":"(\\d+)s"/);
            if (match && match[1]) {
              actualDelay = parseInt(match[1], 10) * 1000;
              console.log(`Using API suggested retry delay: ${actualDelay / 1000}s`);
            }
          }
          await new Promise(resolve => setTimeout(resolve, actualDelay));
          return this.exponentialBackoffRetry(fn, retries - 1, delayMs * 2);
        } else {
          console.error('Gemini API rate limit retries exhausted.');
          throw error;
        }
      }
      console.error('Gemini API encountered non-retryable error:', error);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '';
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Gemini API Error (generateText):', error);
      throw error;
    }
  }

  async getCompletion(parts: Array<{text: string} | {inlineData: {mimeType: string, data: string}}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text() || '';
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Gemini API Error (getCompletion):', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({ model: 'embedding-001' });
      const embedResult = await model.embedContent(text);
      const values = embedResult.embedding.values;
      if (!values) {
        throw new Error('Embedding values are missing in the response');
      }
      return values;
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }
}

export const geminiSimplifiedService = new GeminiSimplifiedService();

export default { geminiSimplifiedService };