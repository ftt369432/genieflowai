import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file');
}

// Log the API key (first few characters) for debugging
console.log('Gemini API Key (first 8 chars):', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Not set');

const genAI = new GoogleGenerativeAI(API_KEY || '');

export class GeminiSimplifiedService {
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(
    model: string = 'gemini-2.0-flash',
    temperature: number = 0.7,
    maxTokens: number = 2048
  ) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async getCompletion(prompt: string): Promise<string> {
    try {
      if (!API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      console.log('Using model:', this.model);
      const model = genAI.getGenerativeModel({ model: this.model });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
        },
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in getCompletion:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while generating completion');
    }
  }
} 