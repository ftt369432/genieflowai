import { Task } from '../types/task';
import OpenAI from 'openai';
import { Event } from '../types/calendar';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for development! In production, use backend proxy
    });
  }

  async enhanceTask(task: Task): Promise<Task> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a task optimization assistant. Enhance the task with better descriptions, tags, and estimated duration."
      }, {
        role: "user",
        content: `Task: ${task.title}\nDescription: ${task.description}`
      }]
    });

    const enhancement = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      ...task,
      ...enhancement
    };
  }

  async estimateTaskDuration(description: string): Promise<number> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Estimate task duration in minutes based on the description."
      }, {
        role: "user",
        content: description
      }]
    });

    return parseInt(completion.choices[0].message.content || '60');
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<Task[]> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a scheduling optimization assistant. Analyze tasks and suggest optimal scheduling."
      }, {
        role: "user",
        content: JSON.stringify(tasks.map(t => ({
          title: t.title,
          duration: t.estimatedDuration,
          priority: t.priority,
          deadline: t.dueDate
        })))
      }]
    });

    const optimizedSchedule = JSON.parse(completion.choices[0].message.content || '[]');
    return tasks.map(task => ({
      ...task,
      ...optimizedSchedule.find((t: any) => t.title === task.title)
    }));
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Suggest optimal meeting times based on event details and common scheduling patterns."
      }, {
        role: "user",
        content: JSON.stringify(event)
      }]
    });

    return JSON.parse(completion.choices[0].message.content || '[]')
      .map((dateStr: string) => new Date(dateStr));
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<string[]> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Analyze schedule for potential conflicts and suggest resolutions."
      }, {
        role: "user",
        content: JSON.stringify(events)
      }]
    });

    return JSON.parse(completion.choices[0].message.content || '[]');
  }
} 