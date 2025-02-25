export type EmailCategory = 'inbox' | 'sent' | 'archive' | 'trash' | 'follow-up' | 'important' | 'work' | 'personal';

export interface EmailCategoryRule {
  id: string;
  name: string;
  conditions: {
    field: 'from' | 'subject' | 'content';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
  }[];
  category: EmailCategory;
  color?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  lastUsed?: Date;
}

export interface EmailAnalytics {
  sentCount: number;
  responseRate: number;
  averageResponseTime: number;
  topRecipients: Array<{ email: string; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
  byDay: Array<{ day: string; count: number }>;
} 