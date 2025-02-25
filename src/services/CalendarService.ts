import { Event, EventType } from '../types/calendar';
import { TaskService } from './TaskService';
import { AIService } from './AIService';

export class CalendarService {
  private events: Event[] = [];

  constructor(
    private taskService: TaskService,
    private aiService: AIService
  ) {}

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const newEvent = {
      id: crypto.randomUUID(),
      ...event,
      created: new Date(),
      lastModified: new Date()
    };
    
    this.events.push(newEvent);
    return newEvent;
  }

  async convertTaskToEvent(taskId: string): Promise<Event> {
    // Implementation for task conversion
    const task = await this.taskService.getTask(taskId);
    return this.createEvent({
      title: task.title,
      startTime: task.dueDate,
      endTime: new Date(task.dueDate.getTime() + task.estimatedDuration),
      type: EventType.TASK,
      metadata: { taskId }
    });
  }

  async bulkConvertTasks(taskIds: string[]): Promise<Event[]> {
    return Promise.all(taskIds.map(id => this.convertTaskToEvent(id)));
  }

  async getEventsForRange(start: Date, end: Date): Promise<Event[]> {
    return this.events.filter(event => 
      event.startTime >= start && event.endTime <= end
    );
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    // Use AI to suggest optimal times
    return this.aiService.suggestEventTimes(event);
  }
} 