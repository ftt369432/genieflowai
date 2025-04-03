import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig } from './aiConfig';

/**
 * Simplified Gemini Service for direct API access
 * This implementation avoids the complex inheritance structure to focus on core functionality
 */
export class GeminiSimplifiedService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  constructor() {
    try {
      // Get API key directly from environment
      this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      
      // Fallback to aiConfig if direct env var is not available
      if (!this.apiKey) {
        try {
          this.apiKey = aiConfig.getApiKey('google');
          console.log('Using API key from aiConfig');
        } catch (error) {
          console.error('Failed to get API key from aiConfig:', error);
        }
      }
      
      if (this.apiKey) {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.isInitialized = true;
        console.log('GeminiSimplifiedService initialized successfully');
      } else {
        console.error('Failed to initialize GeminiSimplifiedService: No API key found');
      }
    } catch (error) {
      console.error('Error initializing GeminiSimplifiedService:', error);
    }
  }

  /**
   * Get a completion from the Gemini API
   */
  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      if (!this.isInitialized || !this.genAI) {
        throw new Error('GeminiSimplifiedService not properly initialized');
      }
      
      const modelName = options?.model || 'gemini-1.5-flash';
      console.log(`Using Gemini model: ${modelName}`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error('Error in getCompletion:', error);
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return 'Unknown error occurred';
    }
  }

  /**
   * Test the connection to the Gemini API
   */
  async testConnection(): Promise<{success: boolean, message: string}> {
    try {
      if (!this.isInitialized || !this.genAI) {
        return {
          success: false, 
          message: 'Service not initialized. API key may be missing.'
        };
      }
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Test connection');
      const response = await result.response;
      return {
        success: true,
        message: `Connection successful. Response: ${response.text().substring(0, 50)}...`
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      if (error instanceof Error) {
        return {
          success: false,
          message: `Connection failed: ${error.message}`
        };
      }
      return {
        success: false,
        message: 'Connection failed with unknown error'
      };
    }
  }

  /**
   * Check if the service is initialized properly
   */
  isReady(): boolean {
    return this.isInitialized && !!this.genAI;
  }

  /**
   * Get the API key being used (for diagnostic purposes)
   */
  getApiKey(): string {
    // Return masked version for security
    if (!this.apiKey) return '';
    const visible = 4;
    return '•'.repeat(Math.max(0, this.apiKey.length - visible)) + 
           this.apiKey.slice(-visible);
  }
}

// Export a singleton instance
export const geminiSimplifiedService = new GeminiSimplifiedService(); 