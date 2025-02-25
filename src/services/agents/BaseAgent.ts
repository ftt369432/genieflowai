import type { AgentConfig } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { ENV } from '../../config/env';
import { openAIService } from '../ai/openai';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected ai = openAIService;
  protected context: Record<string, any> = {};

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(action: string, params: any): Promise<any>;
  abstract train(data: any[]): Promise<void>;
  protected abstract executeAction(action: string, params: any): Promise<ActionResult>;

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