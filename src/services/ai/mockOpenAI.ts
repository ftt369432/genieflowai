import { AIService } from './baseAIService';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { Event } from '../../types/calendar';

export class MockAIService implements AIService {
  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    return `Mock AI response for: ${prompt}\nModel: ${options?.model || 'default'}\nTemperature: ${options?.temperature || 0.7}`;
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Return a mock embedding vector of length 768 (same as Gemini's default)
    return Array(768).fill(0).map(() => Math.random());
  }

  async enhanceTask(task: Task): Promise<Task> {
    return {
      ...task,
      description: task.description + ' (Enhanced by mock AI)',
      tags: ['mock', 'test'],
      estimatedDuration: 60,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO
    };
  }

  async estimateTaskDuration(description: string): Promise<number> {
    // Return a semi-random duration between 30 and 120 minutes
    return Math.floor(Math.random() * 90) + 30;
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<Task[]> {
    const now = new Date();
    return tasks.map((task, index) => ({
      ...task,
      startTime: new Date(now.getTime() + index * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + (index + 1) * 60 * 60 * 1000)
    }));
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    const now = new Date();
    return [
      now,
      new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
      new Date(now.getTime() + 72 * 60 * 60 * 1000)  // Three days from now
    ];
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<string[]> {
    return [
      'No conflicts detected in the schedule',
      'Suggested: Space out meetings more evenly throughout the week',
      'Consider adding buffer time between back-to-back meetings'
    ];
  }
}

export const mockAIService = new MockAIService(); 