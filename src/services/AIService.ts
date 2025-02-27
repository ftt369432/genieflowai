import { Task } from '../types/task';
import { Event } from '../types/calendar';

export interface AIService {
  enhanceTask(task: Task): Promise<Task>;
  estimateTaskDuration(description: string): Promise<number>;
  optimizeTaskSchedule(tasks: Task[]): Promise<Task[]>;
  suggestEventTimes(event: Partial<Event>): Promise<Date[]>;
  analyzeScheduleConflicts(events: Event[]): Promise<string[]>;
  getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string>;
  getEmbedding(text: string): Promise<number[]>;
} 