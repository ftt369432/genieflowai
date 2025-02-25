import { BaseAgent } from './BaseAgent';
import { BehaviorSubject } from 'rxjs';
import type { AgentConfig } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { v4 as uuidv4 } from 'uuid';

export class DocumentAgent extends BaseAgent {
  private documentQueue: BehaviorSubject<string[]>;

  constructor() {
    const config: AgentConfig = {
      id: uuidv4(),
      name: 'document',
      type: 'document',
      capabilities: ['document-processing', 'text-analysis', 'summarization'],
      config: {
        modelName: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.3,
        basePrompt: 'You are a document processing agent specialized in analyzing and extracting information from documents.'
      }
    };
    super(config);
    this.documentQueue = new BehaviorSubject<string[]>([]);
  }

  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'process':
        return this.processDocument(params.documentId);
      case 'analyze':
        return this.analyze(params.documentId);
      case 'extract':
        return this.extract(params.documentId);
      case 'summarize':
        return this.summarize(params.documentId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async train(data: any[]): Promise<void> {
    // Implement document-specific training logic
    console.log('Training document agent with', data.length, 'samples');
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

  async processDocument(documentId: string): Promise<void> {
    try {
      const currentQueue = this.documentQueue.value;
      this.documentQueue.next([...currentQueue, documentId]);
      
      // Document processing logic here
      await this.analyze(documentId);
      await this.extract(documentId);
      await this.summarize(documentId);
      
      // Remove from queue when done
      const updatedQueue = this.documentQueue.value.filter(id => id !== documentId);
      this.documentQueue.next(updatedQueue);
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  private async analyze(documentId: string): Promise<string> {
    this.validateCapability('text-analysis');
    const prompt = `Analyze the document with ID: ${documentId}`;
    return this.getCompletion(prompt);
  }

  private async extract(documentId: string): Promise<string> {
    this.validateCapability('document-processing');
    const prompt = `Extract key information from document with ID: ${documentId}`;
    return this.getCompletion(prompt);
  }

  private async summarize(documentId: string): Promise<string> {
    this.validateCapability('summarization');
    const prompt = `Summarize the document with ID: ${documentId}`;
    return this.getCompletion(prompt);
  }

  getQueueStatus(): string[] {
    return this.documentQueue.value;
  }
} 