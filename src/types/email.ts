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

export interface Credentials {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface EmailAccount {
  id: string;
  type: 'mock';
  email: string;
  connected: boolean;
  tokens?: Credentials;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'starred' | 'important' | 'custom';
  unreadCount?: number;
  totalCount?: number;
  color?: string;
  nested?: boolean;
  parent?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  date: Date;
  labels: string[];
  read: boolean;
  starred: boolean;
}

export interface EmailDraft {
  id: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  inReplyTo?: string;
  savedAt: Date;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  color?: string;
  unreadCount?: number;
  totalCount?: number;
  nested?: boolean;
  parent?: string;
}

export interface EmailFilter {
  id: string;
  name: string;
  conditions: Array<{
    field: 'from' | 'to' | 'subject' | 'body';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
  }>;
  actions: Array<{
    type: 'move' | 'label' | 'star' | 'markRead' | 'forward';
    value: string;
  }>;
  enabled: boolean;
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface EmailPreferences {
  defaultSignatureId?: string;
  defaultReplySignatureId?: string;
  sendAndArchive: boolean;
  confirmBeforeSending: boolean;
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultComposeFormat: 'plain' | 'rich';
  showSnippets: boolean;
  autoAdvance: 'newer' | 'older' | 'none';
  messageDisplay: 'default' | 'comfortable' | 'compact';
  inlineImages: boolean;
  starredPosition: 'left' | 'right';
  keyboard: {
    shortcuts: boolean;
    custom?: Record<string, string>;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    browserTab: boolean;
    priority: 'all' | 'important' | 'none';
  };
  vacation: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    subject?: string;
    message?: string;
    respondTo: 'all' | 'contacts' | 'domain';
  };
}

export interface EmailAnalysis {
  priority: 'high' | 'medium' | 'low';
  topics: string[];
  requiredActions: string[];
  requiresResponse: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  deadlines: Array<{
    date: Date;
    description: string;
  }>;
  meetingRequests: Array<{
    proposedTime: Date;
    duration: number;
    attendees: string[];
  }>;
} 