import { BaseAIService, AIService } from './baseAIService';
import { Task } from '../../types/task';
import { Event } from '../../types/calendar';

export class ClaudeService extends BaseAIService implements AIService {
  constructor() {
    super('claude');
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    throw new Error('Claude API integration not implemented');
  }

  async getEmbedding(text: string): Promise<number[]> {
    throw new Error('Claude embeddings not implemented');
  }

  async enhanceTask(task: Task): Promise<Task> {
    throw new Error('Task enhancement not implemented for Claude');
  }

  async estimateTaskDuration(description: string): Promise<number> {
    throw new Error('Task duration estimation not implemented for Claude');
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<Task[]> {
    throw new Error('Task schedule optimization not implemented for Claude');
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    throw new Error('Event time suggestion not implemented for Claude');
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<string[]> {
    throw new Error('Schedule conflict analysis not implemented for Claude');
  }
} 