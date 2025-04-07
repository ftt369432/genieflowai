import type { IMAPConfig } from '../../components/email/IMAPConfigForm';
import type { EmailMessage } from './types';
import type { EmailFolder } from '../../types';

const API_BASE_URL = '/api/email'; // Update this to match your backend API URL

export class IMAPService {
  private config: IMAPConfig | null = null;
  private accountId: string | null = null;

  async connect(config: IMAPConfig): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to connect to email server');
    }

    const { accountId } = await response.json();
    this.config = config;
    this.accountId = accountId;
  }

  async disconnect(): Promise<void> {
    if (!this.accountId) return;

    await fetch(`${API_BASE_URL}/disconnect/${this.accountId}`, {
      method: 'POST',
    });

    this.config = null;
    this.accountId = null;
  }

  async getFolders(): Promise<EmailFolder[]> {
    if (!this.accountId) {
      throw new Error('Not connected to email server');
    }

    const response = await fetch(`${API_BASE_URL}/folders/${this.accountId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    return response.json();
  }

  async getMessages(options: {
    folder?: string;
    query?: string;
    pageToken?: string;
    maxResults?: number;
  } = {}): Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
  }> {
    if (!this.accountId) {
      throw new Error('Not connected to email server');
    }

    const params = new URLSearchParams({
      folder: options.folder || 'INBOX',
      maxResults: (options.maxResults || 20).toString(),
      ...(options.query && { query: options.query }),
      ...(options.pageToken && { pageToken: options.pageToken }),
    });

    const response = await fetch(`${API_BASE_URL}/messages/${this.accountId}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async sendMessage(message: {
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
  }): Promise<void> {
    if (!this.accountId || !this.config) {
      throw new Error('Not connected to email server');
    }

    const response = await fetch(`${API_BASE_URL}/send/${this.accountId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...message,
        from: this.config.email,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }
} 