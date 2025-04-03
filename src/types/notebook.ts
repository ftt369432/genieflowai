import { Agent } from './agent';
import { Message } from './ai';

export type NotebookType = 'research' | 'documentation' | 'project' | 'personal' | 'meeting';

export type NotebookStatus = 'active' | 'archived' | 'shared';

export interface NotebookBlock {
  id: string;
  type: 'text' | 'ai' | 'task' | 'calendar' | 'code' | 'image';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookSection {
  id: string;
  title: string;
  blocks: NotebookBlock[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notebook {
  id: string;
  title: string;
  description: string;
  sections: NotebookSection[];
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  aiContext?: {
    summary?: string;
    keyTopics?: string[];
    relatedNotebooks?: string[];
    suggestedActions?: {
      type: 'task' | 'calendar' | 'ai';
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
  };
}

export interface NotebookAIResponse {
  content: string;
  metadata?: {
    suggestedTasks?: {
      title: string;
      description: string;
      dueDate?: Date;
      priority: 'low' | 'medium' | 'high';
    }[];
    suggestedCalendarEvents?: {
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      location?: string;
    }[];
    relatedContent?: {
      type: 'notebook' | 'task' | 'calendar';
      id: string;
      title: string;
      relevance: number;
    }[];
  };
} 