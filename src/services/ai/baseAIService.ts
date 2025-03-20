import { aiConfig } from '../aiConfig';
import { isTestKey } from '../../utils/keyValidation';
import { Task } from '../../types/task';
import { Event } from '../../types/calendar';
import { ENV } from '../../config/env';

export interface AIService {
  getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string>;
  
  getEmbedding(text: string): Promise<number[]>;
  
  enhanceTask(task: Task): Promise<Task>;
  
  estimateTaskDuration(description: string): Promise<number>;
  
  optimizeTaskSchedule(tasks: Task[]): Promise<Task[]>;
  
  suggestEventTimes(event: Partial<Event>): Promise<Date[]>;
  
  analyzeScheduleConflicts(events: Event[]): Promise<string[]>;
}

export class BaseAIService {
  protected provider: string;

  constructor(providerId: string) {
    this.provider = providerId;
    console.log(`Initializing ${providerId} AI service`);
  }

  protected getApiKey(providerId: string): string {
    const key = aiConfig.getApiKey(providerId);
    if (!key) {
      console.error(`No API key found for provider: ${providerId}`);
    }
    return key;
  }

  protected async validateProvider(providerId: string): Promise<void> {
    if (!aiConfig.isEnabled(providerId)) {
      console.error(`Provider ${providerId} is not enabled in configuration`);
      throw new Error(`AI provider ${providerId} is not enabled or configured`);
    }
  }

  protected getProviderConfig(providerId: string) {
    return aiConfig.getProviderConfig(providerId);
  }

  protected validateApiKey(key: string | undefined, expectedPrefix?: string) {
    if (isTestKey(key)) {
      console.log('Using test API key');
      return true;
    }

    if (!key) {
      console.error('API key is missing');
      throw new Error('API key is required');
    }

    if (expectedPrefix && !key.startsWith(expectedPrefix)) {
      console.error(`Invalid API key format. Expected prefix: ${expectedPrefix}, got: ${key.slice(0, 4)}`);
      throw new Error(`Invalid API key format. Expected prefix: ${expectedPrefix}`);
    }

    return true;
  }

  protected getGeminiKey(): string {
    const key = ENV.GEMINI_API_KEY;
    
    if (isTestKey(key)) {
      console.log('Using test Gemini API key');
      return key;
    }

    try {
      this.validateApiKey(key, 'AIza');
      console.log('Using Gemini API key with prefix:', key.slice(0, 4));
      return key || '';
    } catch (error) {
      console.error('Gemini API key validation failed:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Falling back to test key in development');
        return 'test-gemini-key';
      }
      throw error;
    }
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    if (error instanceof Error) {
      throw new Error(`${service} API Error: ${error.message}`);
    }
    throw new Error(`${service} API Error: Unknown error occurred`);
  }
} 