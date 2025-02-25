export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completed: boolean;
  tags: string[];
  duration?: number; // Duration in minutes
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'task' | 'break';
  description?: string;
  participants?: string[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  relatedTaskId?: string;
}

export interface Template {
  id: string;
  name: string;
  category: 'email' | 'document';
  content: string;
  variables: string[];
  version?: number;
  createdAt: Date;
  updatedAt: Date;
  usage?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    defaultView: 'month' | 'week' | 'day';
    workingHours: {
      start: number;
      end: number;
    };
    workDays: number[];
  };
}

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  content: string;
  date: Date;
  read: boolean;
  category?: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'system' | 'custom';
  count: number;
}