import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService, AIService } from './ai/baseAIService';
import { Task } from '../types/task';
import { Event } from '../types/calendar';
import { aiConfig } from './aiConfig';
import type { AIModel } from '../types/ai';

interface ConversationTurn {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  history: ConversationTurn[];
  variables: Record<string, any>;
  maxHistoryLength: number;
}

interface PromptTemplate {
  systemRole: string;
  instructions: string[];
  format?: string;
  sourceRequirements?: {
    includeSources: boolean;
    sourceTypes?: string[];
  };
}

interface FollowUpQuestion {
  question: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ScheduleAnalysisResult {
  conflicts: string[];
  followUpQuestions: FollowUpQuestion[];
}

interface Source {
  id: string;
  type: string;
  content: string;
  reference: string;
  relevance: number;
  confidence: number;
}

interface ResponseWithSources<T> {
  data: T;
  sources: Source[];
}

export class GeminiService extends BaseAIService implements AIService {
  private model: AIModel;
  private genAI: GoogleGenerativeAI | null = null;
  private conversationState: ConversationState;

  constructor() {
    super('google');
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
    }
    this.model = {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      capabilities: ['chat', 'text-generation', 'context-understanding'],
      contextSize: 128000
    };

    this.conversationState = {
      history: [],
      variables: {},
      maxHistoryLength: 20
    };
  }

  async generateResponse(message: Message): Promise<Message> {
    try {
      if (!this.genAI) throw new Error('Gemini service not initialized');
      
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      });

      const result = await model.generateContent(message.content);
      const response = await result.response;
      const text = response.text();
      
      if (!text) throw new Error('Empty response from Gemini');

      return {
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw this.handleError(error, 'Gemini');
    }
  }

  async getRelevantSourcesByQuery(query: string): Promise<Source[]> {
    try {
      const context = this.conversationState.history
        .map(turn => turn.content)
        .join('\n');
      
      const sources = await this.getSourcesFromContext(context);
      return this.filterSources(sources, query, 0.3);
    } catch (error) {
      console.error('Error getting relevant sources:', error);
      return [];
    }
  }

  private async getSourcesFromContext(context: string): Promise<Source[]> {
    try {
      if (!this.genAI) throw new Error('Gemini service not initialized');

      const prompt = `Based on this context:
${context}

Generate relevant reference sources that could support this context.
Return as JSON array with fields:
- id (string)
- type (string)
- content (string)
- reference (string)
- relevance (number 0-1)
- confidence (number 0-1)`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) return [];
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating sources:', error);
      return [];
    }
  }

  async sendMessage(message: Message): Promise<Message> {
    return this.generateResponse(message);
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      if (!this.genAI) throw new Error('Gemini service not initialized');

      const model = this.genAI.getGenerativeModel({ 
        model: options?.model || 'gemini-2.0-flash',
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) throw new Error('Empty response from Gemini');
      
      return text;
    } catch (error) {
      throw this.handleError(error, 'Gemini');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.genAI) throw new Error('Gemini service not initialized');

      const model = this.genAI.getGenerativeModel({ 
        model: 'embedding-001',
        generationConfig: {
          temperature: 0
        }
      });

      const embedResult = await model.embedContent(text);
      // Convert embedding to array of numbers
      const values = Object.values(embedResult.embedding);
      return values.map(v => Number(v));
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw this.handleError(error, 'Gemini Embedding');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage = 'Test connection to Gemini 2.0 Flash';
      const response = await this.getCompletion(testMessage, { temperature: 0.1 });
      return response.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async enhanceTask(task: Task): Promise<ResponseWithSources<Task>> {
    return Promise.resolve({ data: task, sources: [] });
  }

  async estimateTaskDuration(description: string): Promise<ResponseWithSources<number>> {
    return Promise.resolve({ data: 60, sources: [] }); // Mock duration of 60 minutes
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<ResponseWithSources<Task[]>> {
    return Promise.resolve({ data: tasks, sources: [] });
  }

  async suggestEventTimes(event: Partial<Event>): Promise<ResponseWithSources<Date[]>> {
    return Promise.resolve({ data: [], sources: [] });
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>> {
    return Promise.resolve({ data: { conflicts: [], followUpQuestions: [] }, sources: [] });
  }

  getSourcesByType(type: string): Source[] {
    return [];
  }

  getSourcesByConfidence(minConfidence?: number): Source[] {
    return [];
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    if (error instanceof Error) {
      throw new Error(`${service} Error: ${error.message}`);
    }
    throw new Error(`${service} Error: Unknown error occurred`);
  }

  // Rest of the class implementation remains unchanged...
}

export const geminiService = new GeminiService();