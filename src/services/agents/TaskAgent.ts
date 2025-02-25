import { BaseAgent } from './BaseAgent';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../../types/tasks';
import type { AgentConfig } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { v4 as uuidv4 } from 'uuid';

export class TaskAgent extends BaseAgent {
  private taskQueue: BehaviorSubject<Task[]>;

  constructor() {
    const config: AgentConfig = {
      id: uuidv4(),
      name: 'task',
      type: 'task',
      capabilities: ['task-processing', 'task-analysis', 'task-scheduling'],
      config: {
        modelName: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.3,
        basePrompt: 'You are a task management agent specialized in analyzing, prioritizing, and scheduling tasks.'
      }
    };
    super(config);
    this.taskQueue = new BehaviorSubject<Task[]>([]);
  }

  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'process':
        return this.processTask(params.task);
      case 'analyze':
        return this.analyze(params.task);
      case 'prioritize':
        return this.prioritize(params.task);
      case 'schedule':
        return this.schedule(params.task);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async train(data: any[]): Promise<void> {
    // Implement task-specific training logic
    console.log('Training task agent with', data.length, 'samples');
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

  async processTask(task: Task): Promise<void> {
    try {
      const currentQueue = this.taskQueue.value;
      this.taskQueue.next([...currentQueue, task]);
      
      // Task processing logic here
      await this.analyze(task);
      await this.prioritize(task);
      await this.schedule(task);
      
      // Remove from queue when done
      const updatedQueue = this.taskQueue.value.filter(t => t.id !== task.id);
      this.taskQueue.next(updatedQueue);
    } catch (error) {
      console.error('Error processing task:', error);
      throw error;
    }
  }

  private async analyze(task: Task): Promise<string> {
    this.validateCapability('task-analysis');
    const prompt = `
      Analyze the following task:
      Title: ${task.title}
      Description: ${task.description}
      Priority: ${task.priority}
      Status: ${task.status}
      
      Provide:
      1. Complexity assessment
      2. Required skills
      3. Dependencies
      4. Risk factors
    `;
    return this.getCompletion(prompt);
  }

  private async prioritize(task: Task): Promise<string> {
    this.validateCapability('task-processing');
    const prompt = `
      Evaluate priority for the following task:
      Title: ${task.title}
      Description: ${task.description}
      Current Priority: ${task.priority}
      
      Consider:
      1. Urgency
      2. Impact
      3. Dependencies
      4. Resource availability
    `;
    return this.getCompletion(prompt);
  }

  private async schedule(task: Task): Promise<string> {
    this.validateCapability('task-scheduling');
    const prompt = `
      Suggest scheduling for the following task:
      Title: ${task.title}
      Description: ${task.description}
      Priority: ${task.priority}
      
      Consider:
      1. Task duration
      2. Dependencies
      3. Resource availability
      4. Optimal time slots
    `;
    return this.getCompletion(prompt);
  }

  getQueueStatus(): Task[] {
    return this.taskQueue.value;
  }
} 