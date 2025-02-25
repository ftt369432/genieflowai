import { Task, TaskPriority } from '../types/task';
import { AIService } from './AIService';

export class TaskService {
  private tasks: Task[] = [];
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    // AI-enhanced task creation
    const enhancedTask = await this.aiService.enhanceTask({
      id: crypto.randomUUID(),
      ...task,
      created: new Date(),
      lastModified: new Date()
    });

    this.tasks.push(enhancedTask);
    return enhancedTask;
  }

  async estimateDuration(taskDescription: string): Promise<number> {
    return this.aiService.estimateTaskDuration(taskDescription);
  }

  async suggestSchedule(tasks: Task[]): Promise<Task[]> {
    return this.aiService.optimizeTaskSchedule(tasks);
  }

  async getTask(id: string): Promise<Task> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new Error(`Task not found: ${id}`);
    return task;
  }

  async getTasks(filter?: Partial<Task>): Promise<Task[]> {
    if (!filter) return this.tasks;
    
    return this.tasks.filter(task => 
      Object.entries(filter).every(([key, value]) => 
        task[key as keyof Task] === value
      )
    );
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Task not found: ${id}`);
    
    const updatedTask = {
      ...this.tasks[index],
      ...updates,
      lastModified: new Date()
    };
    
    this.tasks[index] = updatedTask;
    return updatedTask;
  }
} 