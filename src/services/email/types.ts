/**
 * Email system types
 */

export interface EmailCredentials {
  access_token?: string;
  password?: string;
}

export interface EmailError {
  message: string;
  code?: string;
}

export interface EmailResponse<T> {
  data: T;
  error?: EmailError;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
    body?: {
      data?: string;
    };
  };
  internalDate: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface ParsedEmailAddress {
  value: EmailAddress[];
  text: string;
}

export interface ImapBox {
  messages: {
    total: number;
  };
}

export interface ImapMessageAttributes {
  uid: number;
  flags?: string[];
}

export interface ImapFetchOptions {
  bodies: string | string[];
  struct: boolean;
}

export interface ImapMailboxInfo {
  delimiter?: string;
  children?: { [key: string]: ImapMailboxInfo };
  attribs: string[];
}

export interface EmailMessageMetadata {
  id: string;
  threadId: string;
  labels: string[];
  read: boolean;
  starred: boolean;
}

/**
 * Email account configuration
 */
export interface EmailAccount {
  id: string;
  email: string;
  name?: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'imap' | 'custom';
  isActive?: boolean;
  createdAt?: string;
  connected?: boolean;
  lastSynced?: Date;
  folders?: EmailFolder[];
  accessToken?: string;
  refreshToken?: string;
  imapConfig?: {
    host: string;
    port: number;
    useSSL: boolean;
  };
  smtpConfig?: {
    host: string;
    port: number;
    useSSL: boolean;
  };
  credentials?: {
    password?: string;
  };
  preferences?: EmailPreferences;
}

/**
 * Email folder structure
 */
export interface EmailFolder {
  id: string;
  name: string;
  type: 'system' | 'user';
  unreadCount: number;
  totalCount: number;
}

/**
 * Email message structure
 */
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string | string[];
  body: string;
  snippet?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
  labels?: string[];
  read?: boolean;
  starred?: boolean;
  date: string;
}

/**
 * Email attachment structure
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content?: Blob;
  url?: string;
}

/**
 * Email draft structure
 */
export interface EmailDraft {
  id: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  lastModified: Date;
  inReplyTo?: string;
  references?: string[];
}

/**
 * Email filter configuration
 */
export interface EmailFilter {
  id: string;
  name: string;
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  actions: {
    type: string;
    value: string;
  }[];
}

/**
 * Email user preferences
 */
export interface EmailPreferences {
  signatureHtml?: string;
  defaultReplyBehavior?: 'replyAll' | 'reply';
  sendAndArchive?: boolean;
  confirmBeforeSending?: boolean;
  autoCheckSpelling?: boolean;
  defaultFontFamily?: string;
  defaultFontSize?: number;
  inlineImages?: boolean;
  showSnippets?: boolean;
}

/**
 * Email service types
 */

export interface EmailQuery {
  folderId?: string;
  labelId?: string;
  search?: string;
  unread?: boolean;
  starred?: boolean;
  hasAttachment?: boolean;
  from?: string;
  to?: string;
  subject?: string;
  before?: Date;
  after?: Date;
  pageSize?: number;
  pageToken?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  color?: { backgroundColor: string };
}

export interface IMAPConfig {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  useSSL: boolean;
  provider?: 'outlook' | 'yahoo' | 'aol' | 'custom';
}