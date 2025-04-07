import Anthropic from '@anthropic-ai/sdk';
import { BaseAIService } from './baseAIService';
import type { Message } from '../../types/ai';

export class ClaudeService extends BaseAIService {
  private client: Anthropic;

  constructor() {
    super('claude');
    const apiKey = this.getApiKey('claude');
    this.client = new Anthropic({
      apiKey
    });
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-2',
        max_tokens: 1000,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      });

      return message.content[0].text;
    } catch (error) {
      this.handleError(error, 'Claude');
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

export const claudeService = new ClaudeService(); 