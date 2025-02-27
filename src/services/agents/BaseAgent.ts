import type { AgentConfig, ActionMetrics } from '../../types/workflow';
import { BehaviorSubject } from 'rxjs';
import { ActionResult } from '../../types/actions';
import { ENV } from '../../config/env';
import { openAIService } from '../ai/openai';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected ai = openAIService;
  protected context: Record<string, any> = {};
  protected metrics$ = new BehaviorSubject<ActionMetrics[]>([]);
  protected isExecuting$ = new BehaviorSubject<boolean>(false);

  constructor(config: AgentConfig) {
    this.config = config;
  }

  public abstract executeAction(action: string, params: any): Promise<any>;
  public abstract train(data: any[]): Promise<void>;

  protected async executeWithMetrics<T>(
    action: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.isExecuting$.next(true);

    try {
      const result = await executor();
      this.recordMetrics({
        action,
        success: true,
        duration: Date.now() - startTime,
        output: result
      });
      return result;
    } catch (error) {
      this.recordMetrics({
        action,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      this.isExecuting$.next(false);
    }
  }

  protected recordMetrics(metrics: ActionMetrics): void {
    const currentMetrics = this.metrics$.value;
    this.metrics$.next([...currentMetrics, metrics]);
  }

  public getMetrics(): ActionMetrics[] {
    return this.metrics$.value;
  }

  public isExecuting(): boolean {
    return this.isExecuting$.value;
  }

  protected validateAction(action: string): void {
    if (!this.config.capabilities.includes(action)) {
      throw new Error(`Action '${action}' is not supported by agent '${this.config.name}'`);
    }
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i === maxRetries - 1) break;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  protected async getCompletion(prompt: string, context: Record<string, any> = {}): Promise<string> {
    const modelName = ENV.OPENAI_MODEL_NAME || 'gpt-4';
    const maxTokens = ENV.OPENAI_MAX_TOKENS || 2000;

    const response = await this.ai.getCompletion(prompt, {
      model: modelName,
      maxTokens,
      temperature: 0.7
    });

    return response;
  }

  protected buildSystemPrompt(context?: Record<string, any>): string {
    let prompt = this.config.config.basePrompt;

    if (context) {
      prompt += '\n\nContext:\n' + 
        Object.entries(context)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
    }

    return prompt;
  }

  protected validateResult(result: any): boolean {
    // Implement basic validation
    return result != null && !result.error;
  }

  protected formatError(error: any): string {
    return error instanceof Error ? error.message : 'Unknown error occurred';
  }

  protected validateCapability(capability: string) {
    if (!this.config.capabilities.includes(capability)) {
      throw new Error(`Agent ${this.config.name} does not have capability: ${capability}`);
    }
  }

  protected async logAction(action: string, result: any) {
    // Implement action logging
  }
}

// Similar implementations for DocumentAgent, CalendarAgent, etc. 