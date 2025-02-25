import { BaseAgent } from './BaseAgent';
import type { AgentConfig } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { EmailService, type Email } from '../EmailService';
import { v4 as uuidv4 } from 'uuid';

export class EmailAgent extends BaseAgent {
  private emailService: EmailService;

  constructor() {
    const config: AgentConfig = {
      id: uuidv4(),
      name: 'email',
      type: 'email',
      capabilities: ['email-analysis', 'email-drafting', 'email-categorization'],
      config: {
        modelName: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.3,
        basePrompt: 'You are an email management agent specialized in analyzing and drafting emails.'
      }
    };
    super(config);
    this.emailService = new EmailService();
  }

  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'analyze':
        return this.analyzeEmail(params.email);
      case 'draft':
        return this.draftResponse(params.email, params.context);
      case 'categorize':
        return this.categorizeEmail(params.email);
      case 'extract-entities':
        return this.extractEntities(params.email);
      case 'suggest-followup':
        return this.suggestFollowUp(params.email);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async train(data: any[]): Promise<void> {
    // Implement email-specific training logic
    console.log('Training email agent with', data.length, 'samples');
  }

  protected async executeAction(action: string, params: any): Promise<ActionResult> {
    try {
      const startTime = Date.now();
      const result = await this.execute(action, params);
      const duration = Date.now() - startTime;
      
      return {
        output: result,
        duration,
      };
    } catch (error) {
      return { 
        output: null,
        duration: 0,
        error: this.formatError(error)
      };
    }
  }

  private async analyzeEmail(email: Email): Promise<{
    priority: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
    summary: string;
  }> {
    this.validateCapability('email-analysis');
    return this.emailService.analyzeEmail(email);
  }

  private async draftResponse(email: Email, context?: Record<string, any>): Promise<{
    subject: string;
    to: string[];
    content: string;
  }> {
    this.validateCapability('email-drafting');
    return this.emailService.draftResponse(email, context);
  }

  private async categorizeEmail(email: Email): Promise<string[]> {
    this.validateCapability('email-categorization');
    return this.emailService.categorizeEmail(email);
  }

  private async extractEntities(email: Email): Promise<{
    people: string[];
    organizations: string[];
    dates: string[];
    locations: string[];
  }> {
    this.validateCapability('email-analysis');
    return this.emailService.extractEntities(email);
  }

  private async suggestFollowUp(email: Email): Promise<{
    shouldFollowUp: boolean;
    suggestedDate?: Date;
    reason?: string;
  }> {
    this.validateCapability('email-analysis');
    return this.emailService.suggestFollowUp(email);
  }
} 