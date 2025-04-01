import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../../config/env';
import { EmailAnalysis } from '../email/EmailService';

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
  sourceEmail?: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  };
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., every 2 weeks
    endDate?: Date;
  };
  relatedCalendarEventId?: string;
}

export interface TaskFilter {
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  dueDateCompare?: 'before' | 'after' | 'on' | 'today' | 'tomorrow' | 'this_week' | 'next_week';
  tags?: string[];
  title?: string;
  sourceEmailId?: string;
}

/**
 * Service for managing tasks
 */
export class TaskService {
  private tasks: Task[] = [];
  private storageKey = 'genieflow_tasks';

  constructor() {
    this.loadTasksFromStorage();
    console.log(`TaskService initialized with ${this.tasks.length} tasks`);
  }

  /**
   * Load tasks from local storage
   */
  private loadTasksFromStorage(): void {
    const { useMock } = getEnv();
    
    try {
      const tasksJson = localStorage.getItem(this.storageKey);
      if (tasksJson) {
        const parsedTasks = JSON.parse(tasksJson);
        
        // Convert date strings back to Date objects
        this.tasks = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          sourceEmail: task.sourceEmail ? {
            ...task.sourceEmail,
            receivedAt: new Date(task.sourceEmail.receivedAt)
          } : undefined,
          recurrence: task.recurrence ? {
            ...task.recurrence,
            endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined
          } : undefined
        }));
      } else if (useMock) {
        this.initializeMockTasks();
      }
    } catch (error) {
      console.error('Failed to load tasks from storage:', error);
      if (useMock) {
        this.initializeMockTasks();
      }
    }
  }

  /**
   * Save tasks to local storage
   */
  private saveTasksToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks to storage:', error);
    }
  }

  /**
   * Initialize with mock tasks
   */
  private initializeMockTasks(): void {
    const now = new Date();
    
    this.tasks = [
      {
        id: uuidv4(),
        title: 'Review project proposal',
        description: 'Review the project proposal document and provide feedback',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(now.getTime() + 86400000), // Tomorrow
        createdAt: now,
        updatedAt: now,
        tags: ['work', 'project']
      },
      {
        id: uuidv4(),
        title: 'Schedule team meeting',
        description: 'Set up a team meeting to discuss Q3 objectives',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 86400000 * 2), // Day after tomorrow
        createdAt: new Date(now.getTime() - 86400000), // Yesterday
        updatedAt: now,
        tags: ['work', 'team']
      },
      {
        id: uuidv4(),
        title: 'Submit expense report',
        description: 'Submit expense report for the recent business trip',
        status: 'done',
        priority: 'low',
        createdAt: new Date(now.getTime() - 86400000 * 3), // 3 days ago
        updatedAt: new Date(now.getTime() - 86400000), // Yesterday
        completedAt: new Date(now.getTime() - 86400000), // Yesterday
        tags: ['work', 'finance']
      }
    ];
    
    this.saveTasksToStorage();
  }

  /**
   * Get all tasks, optionally filtered
   */
  public async getTasks(filter?: TaskFilter): Promise<Task[]> {
    await this.simulateNetworkDelay();
    
    let filteredTasks = [...this.tasks];
    
    if (filter) {
      if (filter.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filter.status);
      }
      
      if (filter.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
      }
      
      if (filter.title) {
        const titleLower = filter.title.toLowerCase();
        filteredTasks = filteredTasks.filter(
          task => task.title.toLowerCase().includes(titleLower)
        );
      }
      
      if (filter.tags && filter.tags.length > 0) {
        filteredTasks = filteredTasks.filter(
          task => filter.tags!.some(tag => task.tags.includes(tag))
        );
      }
      
      if (filter.sourceEmailId) {
        filteredTasks = filteredTasks.filter(
          task => task.sourceEmail?.messageId === filter.sourceEmailId
        );
      }
      
      if (filter.dueDate || filter.dueDateCompare) {
        filteredTasks = this.filterByDueDate(filteredTasks, filter);
      }
    }
    
    // Sort by priority first, then by due date if present
    return filteredTasks.sort((a, b) => {
      // Sort by priority (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date (if present)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      } else if (a.dueDate) {
        return -1; // a comes first (has due date)
      } else if (b.dueDate) {
        return 1; // b comes first (has due date)
      }
      
      // Finally sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Helper method to filter tasks by due date
   */
  private filterByDueDate(tasks: Task[], filter: TaskFilter): Task[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Start of this week (assuming Sunday as the first day)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    // End of next week
    const nextWeekEnd = new Date(thisWeekStart);
    nextWeekEnd.setDate(thisWeekStart.getDate() + 14);
    
    return tasks.filter(task => {
      if (!task.dueDate) {
        return filter.dueDate === null; // Only if explicitly filtering for null dates
      }
      
      const taskDueDate = new Date(task.dueDate);
      
      if (filter.dueDate) {
        const filterDate = new Date(filter.dueDate);
        
        switch (filter.dueDateCompare) {
          case 'before':
            return taskDueDate < filterDate;
          case 'after':
            return taskDueDate > filterDate;
          case 'on':
            return taskDueDate.getFullYear() === filterDate.getFullYear() &&
                  taskDueDate.getMonth() === filterDate.getMonth() &&
                  taskDueDate.getDate() === filterDate.getDate();
          default:
            return true;
        }
      } else if (filter.dueDateCompare) {
        switch (filter.dueDateCompare) {
          case 'today':
            return taskDueDate.getFullYear() === today.getFullYear() &&
                  taskDueDate.getMonth() === today.getMonth() &&
                  taskDueDate.getDate() === today.getDate();
          case 'tomorrow':
            return taskDueDate.getFullYear() === tomorrow.getFullYear() &&
                  taskDueDate.getMonth() === tomorrow.getMonth() &&
                  taskDueDate.getDate() === tomorrow.getDate();
          case 'this_week':
            return taskDueDate >= thisWeekStart && taskDueDate < nextWeekEnd;
          case 'next_week':
            const nextWeekStart = new Date(thisWeekStart);
            nextWeekStart.setDate(thisWeekStart.getDate() + 7);
            return taskDueDate >= nextWeekStart && taskDueDate < nextWeekEnd;
          default:
            return true;
        }
      }
      
      return true;
    });
  }

  /**
   * Get a task by ID
   */
  public async getTask(id: string): Promise<Task | null> {
    await this.simulateNetworkDelay();
    return this.tasks.find(task => task.id === id) || null;
  }

  /**
   * Create a new task
   */
  public async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await this.simulateNetworkDelay();
    
    const now = new Date();
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      createdAt: now,
      updatedAt: now
    };
    
    this.tasks.push(newTask);
    this.saveTasksToStorage();
    
    return newTask;
  }

  /**
   * Update a task
   */
  public async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task | null> {
    await this.simulateNetworkDelay();
    
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;
    
    const updatedTask = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date()
    };
    
    // If status is changed to 'done', set completedAt
    if (updates.status === 'done' && this.tasks[index].status !== 'done') {
      updatedTask.completedAt = new Date();
    }
    
    // If status is changed from 'done', clear completedAt
    if (this.tasks[index].status === 'done' && updates.status && updates.status !== 'done') {
      updatedTask.completedAt = undefined;
    }
    
    this.tasks[index] = updatedTask;
    this.saveTasksToStorage();
    
    return updatedTask;
  }

  /**
   * Delete a task
   */
  public async deleteTask(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    const wasDeleted = initialLength > this.tasks.length;
    
    if (wasDeleted) {
      this.saveTasksToStorage();
    }
    
    return wasDeleted;
  }

  /**
   * Extract tasks from email analysis
   */
  public async extractTasksFromEmail(emailAnalysis: EmailAnalysis, emailInfo: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  }): Promise<Task[]> {
    await this.simulateNetworkDelay();
    
    const extractedTasks: Task[] = [];
    const now = new Date();
    
    // Process action items from the analysis
    if (emailAnalysis.actionItems && emailAnalysis.actionItems.length > 0) {
      for (const actionItem of emailAnalysis.actionItems) {
        const newTask: Task = {
          id: uuidv4(),
          title: actionItem,
          description: `Task extracted from email: "${emailInfo.subject}"`,
          status: 'todo',
          priority: this.mapPriorityFromEmailAnalysis(emailAnalysis.priority),
          createdAt: now,
          updatedAt: now,
          tags: [emailAnalysis.category === 'personal' ? 'personal' : 'work'],
          sourceEmail: {
            messageId: emailInfo.messageId,
            accountId: emailInfo.accountId,
            subject: emailInfo.subject,
            sender: emailInfo.sender,
            receivedAt: emailInfo.receivedAt
          }
        };
        
        // Attempt to extract a due date
        const dueDate = this.extractDueDateFromText(actionItem);
        if (dueDate) {
          newTask.dueDate = dueDate;
        }
        
        extractedTasks.push(newTask);
        this.tasks.push(newTask);
      }
      
      this.saveTasksToStorage();
    }
    
    // If there's a meeting in the email, create a task for meeting preparation
    if (emailAnalysis.meetingDetails) {
      let meetingTitle = `Prepare for meeting`;
      if (emailInfo.subject.toLowerCase().includes('meeting')) {
        meetingTitle = `Prepare for: ${emailInfo.subject}`;
      }
      
      const meetingTask: Task = {
        id: uuidv4(),
        title: meetingTitle,
        description: `Prepare for meeting ${emailAnalysis.meetingDetails.date ? `on ${emailAnalysis.meetingDetails.date}` : ''} ${emailAnalysis.meetingDetails.time ? `at ${emailAnalysis.meetingDetails.time}` : ''}`,
        status: 'todo',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        tags: ['meeting', emailAnalysis.category === 'personal' ? 'personal' : 'work'],
        sourceEmail: {
          messageId: emailInfo.messageId,
          accountId: emailInfo.accountId,
          subject: emailInfo.subject,
          sender: emailInfo.sender,
          receivedAt: emailInfo.receivedAt
        }
      };
      
      // Set due date to 1 hour before meeting if date is available
      if (emailAnalysis.meetingDetails.date) {
        try {
          let meetingDate: Date | undefined;
          
          // Try to parse the date and time
          if (emailAnalysis.meetingDetails.date && emailAnalysis.meetingDetails.time) {
            const dateTimeStr = `${emailAnalysis.meetingDetails.date} ${emailAnalysis.meetingDetails.time}`;
            meetingDate = new Date(dateTimeStr);
          } else if (emailAnalysis.meetingDetails.date) {
            meetingDate = new Date(emailAnalysis.meetingDetails.date);
          }
          
          if (meetingDate && !isNaN(meetingDate.getTime())) {
            // Set due date to 1 hour before meeting
            meetingDate.setHours(meetingDate.getHours() - 1);
            meetingTask.dueDate = meetingDate;
          }
        } catch (error) {
          console.error('Failed to parse meeting date:', error);
        }
      }
      
      extractedTasks.push(meetingTask);
      this.tasks.push(meetingTask);
      this.saveTasksToStorage();
    }
    
    return extractedTasks;
  }

  /**
   * Extract a due date from text
   */
  private extractDueDateFromText(text: string): Date | undefined {
    const lowerText = text.toLowerCase();
    const now = new Date();
    
    // Check for common time phrases
    if (lowerText.includes('today')) {
      return new Date(now.setHours(17, 0, 0, 0)); // 5 PM today
    }
    
    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow
      return tomorrow;
    }
    
    if (lowerText.includes('this week') || lowerText.includes('by the end of the week')) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay())); // Friday
      endOfWeek.setHours(17, 0, 0, 0); // 5 PM
      return endOfWeek;
    }
    
    if (lowerText.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7); // 7 days later
      return nextWeek;
    }
    
    if (lowerText.includes('this month') || lowerText.includes('by the end of the month')) {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(17, 0, 0, 0); // 5 PM
      return endOfMonth;
    }
    
    // Try to extract specific date patterns
    // Format: MM/DD/YYYY or MM-DD-YYYY
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const dateMatch = lowerText.match(datePattern);
    
    if (dateMatch) {
      const [_, month, day, year] = dateMatch;
      const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
      return new Date(fullYear, parseInt(month) - 1, parseInt(day), 17, 0, 0, 0);
    }
    
    // Format: Month Day, Year or Month Day
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const monthPattern = new RegExp(`(${monthNames.join('|')})[\\s,]+(\\d{1,2})(?:[\\s,]+(\\d{4}))?`, 'i');
    const monthMatch = lowerText.match(monthPattern);
    
    if (monthMatch) {
      const [_, month, day, year] = monthMatch;
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
      if (monthIndex !== -1) {
        const fullYear = year ? parseInt(year) : now.getFullYear();
        return new Date(fullYear, monthIndex, parseInt(day), 17, 0, 0, 0);
      }
    }
    
    // Check for "in X days/weeks/months"
    const inTimePattern = /in\s+(\d+)\s+(day|days|week|weeks|month|months)/i;
    const inTimeMatch = lowerText.match(inTimePattern);
    
    if (inTimeMatch) {
      const [_, amount, unit] = inTimeMatch;
      const futureDate = new Date(now);
      
      if (unit.toLowerCase().includes('day')) {
        futureDate.setDate(futureDate.getDate() + parseInt(amount));
      } else if (unit.toLowerCase().includes('week')) {
        futureDate.setDate(futureDate.getDate() + (parseInt(amount) * 7));
      } else if (unit.toLowerCase().includes('month')) {
        futureDate.setMonth(futureDate.getMonth() + parseInt(amount));
      }
      
      futureDate.setHours(17, 0, 0, 0); // 5 PM
      return futureDate;
    }
    
    return undefined;
  }

  /**
   * Map email priority to task priority
   */
  private mapPriorityFromEmailAnalysis(emailPriority: string): 'low' | 'medium' | 'high' {
    switch (emailPriority) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Add tags to a task
   */
  public async addTagsToTask(taskId: string, tags: string[]): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;
    
    // Filter out duplicates and add new tags
    const uniqueTags = [...new Set([...task.tags, ...tags])];
    
    return this.updateTask(taskId, { tags: uniqueTags });
  }

  /**
   * Create recurring copies of a task
   */
  public async createRecurringTask(taskId: string, recurrence: Task['recurrence']): Promise<Task | null> {
    const originalTask = await this.getTask(taskId);
    if (!originalTask) return null;
    
    // Add recurrence to the original task
    const updatedTask = await this.updateTask(taskId, { recurrence });
    return updatedTask;
  }

  /**
   * Helper to simulate network delay
   */
  private async simulateNetworkDelay(min: number = 100, max: number = 300): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export singleton instance
export const taskService = new TaskService();