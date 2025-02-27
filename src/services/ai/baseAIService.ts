import { aiConfig } from '../aiConfig';
import { isTestKey } from '../../utils/keyValidation';
import { Task } from '../../types/task';
import { Event } from '../../types/calendar';

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
  }

  protected getApiKey(providerId: string): string {
    return aiConfig.getApiKey(providerId);
  }

  protected async validateProvider(providerId: string): Promise<void> {
    if (!aiConfig.isEnabled(providerId)) {
      throw new Error(`AI provider ${providerId} is not enabled or configured`);
    }
  }

  protected getProviderConfig(providerId: string) {
    return aiConfig.getProviderConfig(providerId);
  }

  protected validateApiKey(key: string | undefined, expectedPrefix?: string) {
    if (isTestKey(key)) {
      return true;
    }

    if (!key) {
      throw new Error('API key is required');
    }

    if (expectedPrefix && !key.startsWith(expectedPrefix)) {
      throw new Error(`Invalid API key format. Expected prefix: ${expectedPrefix}`);
    }

    return true;
  }

  protected getGeminiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (isTestKey(key)) {
      return key;
    }

    try {
      this.validateApiKey(key, 'AIza');
      return key || '';
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        return 'test-gemini-key';
      }
      throw error;
    }
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    throw error;
  }
} 