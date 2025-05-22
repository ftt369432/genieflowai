import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService, AIService } from './ai/baseAIService';
import { Task } from '../types/task';
import { Event } from '../types/calendar';
import { aiConfig } from './aiConfig';
import type { AIModel, Message, AIAnalysis as CoreAIAnalysis } from '../types/ai';
import type { EmailMessage, EmailAnalysis } from '../services/email/types';
import type { Workflow } from '../store/workflowStore';

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
  model: AIModel;
  private genAI: GoogleGenerativeAI | null = null;
  private conversationState: ConversationState;
  private apiKey: string;

  constructor() {
    super('google');
    this.apiKey = '';
    try {
      this.apiKey = aiConfig.getApiKey('google');
      if (!this.apiKey) {
        throw new Error('API key for Gemini is missing.');
      }
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      this.genAI = null;
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

  async generateResponse(messages: Message[]): Promise<string> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return '';
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model.id });
      const result = await model.generateContent(lastUserMessage.content);
      return result.response.text();
    } catch (error) {
      throw this.handleError(error, 'GeminiGenerateResponse');
    }
  }

  async getRelevantSourcesByQuery(query: string): Promise<Source[]> {
    console.warn("getRelevantSourcesByQuery not implemented");
    return [];
  }

  private async getSourcesFromContext(context: string): Promise<Source[]> {
    try {
      if (!this.genAI) throw new Error('Gemini service not initialized or API key missing');

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
      const responseText = result.response.text();
      
      if (!responseText) return [];
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error generating sources:', error);
      return [];
    }
  }

  async sendMessage(message: Message): Promise<Message> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model.id });
      const result = await model.generateContent(message.content);
      const responseMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response.text(),
        timestamp: new Date()
      };
      return responseMessage;
    } catch (error) {
      throw this.handleError(error, 'GeminiSendMessage');
    }
  }

  async getCompletion(prompt: string, options?: any): Promise<string> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: options?.model || this.model.id,
        generationConfig: { maxOutputTokens: options?.maxTokens, temperature: options?.temperature || 0.7 }
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw this.handleError(error, 'GeminiGetCompletion');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'GeminiGetEmbedding');
    }
  }

  async testConnection(): Promise<boolean> {
    console.warn("testConnection not fully implemented");
    return this.genAI !== null;
  }

  async enhanceTask(task: Task): Promise<ResponseWithSources<Task>> {
    console.warn("enhanceTask not implemented in GeminiService");
    return { data: task, sources: [] };
  }

  async estimateTaskDuration(task: Task): Promise<ResponseWithSources<number>> {
    console.warn("estimateTaskDuration not implemented in GeminiService");
    return { data: 60, sources: [] };
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<ResponseWithSources<Task[]>> {
    console.warn("optimizeTaskSchedule not implemented in GeminiService");
    return { data: tasks, sources: [] };
  }

  async suggestEventTimes(event: Partial<Event>): Promise<ResponseWithSources<Date[]>> {
    console.warn("suggestEventTimes not implemented in GeminiService");
    return { data: [], sources: [] };
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>> {
    console.warn("analyzeScheduleConflicts not implemented in GeminiService");
    return { data: { conflicts: [], followUpQuestions: [] }, sources: [] };
  }

  getSourcesByType(type: string): Source[] {
    console.warn("getSourcesByType not implemented");
    return [];
  }

  getSourcesByConfidence(minConfidence?: number): Source[] {
    console.warn("getSourcesByConfidence not implemented");
    return [];
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    if (error instanceof Error) {
      throw new Error(`${service} Error: ${error.message}`);
    }
    throw new Error(`${service} Error: An unknown error occurred`);
  }

  async generateWorkflowFromPrompt(userPrompt: string): Promise<Workflow> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    try {
      const instruction = `Create a JSON workflow for: "${userPrompt}".\nJSON structure: { id, name, description, trigger, steps: [{ id, agentId, actionType, name, description, input, inputType, outputMapping }], created, status }.\nKey details: 
- 'id' and 'steps.id': new UUIDs.
- 'name': concise workflow name.
- 'description': user's prompt or summary.
- 'trigger': 'manual'.
- 'steps.agentId': 'agent-default-id'.
- 'steps.actionType': general type like 'chat', 'summarize'.
- 'steps.input': user's prompt for the first step.
- 'steps.inputType': 'static' for the first step.
- 'created': Valid ISO8601 date string (current date).
- 'status': 'inactive'.\nRespond with ONLY the JSON object.`;

      const jsonResponse = await this.getCompletion(instruction, { temperature: 0.3, model: this.model.id });
      
      let parsedWorkflow: any;
      try {
        parsedWorkflow = JSON.parse(jsonResponse);
      } catch (e) {
        console.error('GeminiService: Failed to parse workflow JSON:', e, "Raw response was: ", jsonResponse);
        throw new Error('AI failed to return valid JSON for workflow.');
      }

      const newWorkflow: Workflow = {
        id: parsedWorkflow.id || crypto.randomUUID(),
        name: parsedWorkflow.name || `Workflow: ${userPrompt.substring(0,25)}...`,
        description: parsedWorkflow.description || userPrompt,
        trigger: parsedWorkflow.trigger || 'manual',
        steps: (parsedWorkflow.steps && parsedWorkflow.steps.length > 0) ? parsedWorkflow.steps.map((step: any) => ({
          id: step.id || crypto.randomUUID(),
          agentId: step.agentId || 'agent-default-id',
          actionType: step.actionType || 'chat',
          name: step.name || 'Generated Step',
          description: step.description || 'Generated Step Description',
          input: step.input || userPrompt,
          inputType: step.inputType || 'static',
          outputMapping: step.outputMapping || `step_${crypto.randomUUID().substring(0,4)}_output`
        })) : [{
          id: crypto.randomUUID(),
          agentId: 'agent-default-id',
          actionType: 'chat',
          name: 'Initial Task',
          description: 'Default first step based on prompt',
          input: userPrompt,
          inputType: 'static',
          outputMapping: 'initialOutput'
        }],
        created: parsedWorkflow.created ? new Date(parsedWorkflow.created) : new Date(),
        status: parsedWorkflow.status || 'inactive',
      };
      
      return newWorkflow;

    } catch (error) {
      if (error instanceof Error && error.message.startsWith('AI failed to return valid JSON')) { throw error; }
      throw this.handleError(error, 'GeminiWorkflowGeneration');
    }
  }

  async enhanceText(userPrompt: string): Promise<string> {
    if (!this.genAI) throw new Error('Gemini service not initialized (API key issue?)');
    try {
      const instruction = `Review and enhance this text to be clearer, more concise, or more professional: "${userPrompt}". Return only the enhanced text.`;
      const enhancedText = await this.getCompletion(instruction, { temperature: 0.7, model: this.model.id });
      
      if (!enhancedText || enhancedText.trim() === '') {
        return userPrompt;
      }
      return enhancedText;

    } catch (error) {
      throw this.handleError(error, 'GeminiTextEnhancement');
    }
  }

  async analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis | null> {
    console.warn("analyzeEmailForCalendarEvent not implemented in GeminiService - returning null");
    return null;
  }
}

export const geminiService = new GeminiService();