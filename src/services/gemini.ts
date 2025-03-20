import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService, AIService } from './ai/baseAIService';
import { Task } from '../types/task';
import { Event } from '../types/calendar';
import { ENV } from '../config/env';

export class GeminiService extends BaseAIService implements AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    super('google');
    const apiKey = this.getGeminiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file');
    }
    if (!apiKey.startsWith('AIza')) {
      throw new Error('Invalid Gemini API key format. Key must start with "AIza"');
    }
    console.log('Initializing Gemini service with model:', ENV.AI_MODEL);
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      const modelName = options?.model || ENV.AI_MODEL;
      console.log('Using Gemini model:', modelName);
      
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error.message?.includes('API key not valid')) {
        throw new Error('Invalid Gemini API key. Please get a valid key from https://makersuite.google.com/app/apikey');
      }
      if (error.message?.includes('model not found')) {
        throw new Error(`Model ${options?.model || ENV.AI_MODEL} not found. Please check your model configuration.`);
      }
      return this.handleError(error, 'Gemini');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return Array.from(result.embedding.values);
    } catch (error) {
      return this.handleError(error, 'Gemini Embedding');
    }
  }

  async enhanceTask(task: Task): Promise<Task> {
    const prompt = `Task: ${task.title}\nDescription: ${task.description}\n\nEnhance this task with better descriptions, tags, and estimated duration. Return the result as a JSON object.`;
    
    try {
      const result = await this.getCompletion(prompt);
      const enhancement = JSON.parse(result);
      return {
        ...task,
        ...enhancement
      };
    } catch (error) {
      console.error('Error enhancing task:', error);
      return task;
    }
  }

  async estimateTaskDuration(description: string): Promise<number> {
    const prompt = `Given this task description, estimate how many minutes it will take to complete: "${description}". Return only the number.`;
    
    try {
      const result = await this.getCompletion(prompt);
      return parseInt(result) || 60;
    } catch (error) {
      console.error('Error estimating duration:', error);
      return 60;
    }
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<Task[]> {
    const prompt = `Analyze these tasks and suggest optimal scheduling. Tasks: ${JSON.stringify(tasks.map(t => ({
      title: t.title,
      duration: t.estimatedDuration,
      priority: t.priority,
      deadline: t.dueDate
    })))}. Return the optimized schedule as a JSON array.`;
    
    try {
      const result = await this.getCompletion(prompt);
      const optimizedSchedule = JSON.parse(result);
      return tasks.map(task => ({
        ...task,
        ...optimizedSchedule.find((t: any) => t.title === task.title)
      }));
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      return tasks;
    }
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    const prompt = `Suggest optimal meeting times for this event: ${JSON.stringify(event)}. Return an array of ISO date strings.`;
    
    try {
      const result = await this.getCompletion(prompt);
      return JSON.parse(result).map((dateStr: string) => new Date(dateStr));
    } catch (error) {
      console.error('Error suggesting event times:', error);
      return [];
    }
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<string[]> {
    const prompt = `Analyze these events for potential conflicts and suggest resolutions: ${JSON.stringify(events)}. Return an array of suggestions.`;
    
    try {
      const result = await this.getCompletion(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
      return [];
    }
  }

  async testConnection(): Promise<string> {
    try {
      console.log('Testing Gemini connection with model:', ENV.AI_MODEL);
      const model = this.genAI.getGenerativeModel({ model: ENV.AI_MODEL });
      const result = await model.generateContent('Test connection');
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return this.handleError(error, 'Gemini');
    }
  }
}

export const geminiService = new GeminiService(); 