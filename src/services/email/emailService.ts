/**
 * Email Service
 * 
 * Handles fetching and processing of emails from Gmail API
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from '../google/GoogleAPIClient';
import { EmailAccount, EmailMessage, EmailOptions } from './types';

// Types for email data
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet: string;
  labels: string[];
  attachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
}

// Email fetch options
export interface EmailOptions {
  maxResults?: number;
  labelIds?: string[];
  q?: string;
  pageToken?: string;
}

// Email service response
export interface EmailResponse {
  messages: EmailMessage[];
  nextPageToken?: string | null;
  resultSizeEstimate: number;
}

export class EmailService {
  private static instance: EmailService;
  private googleClient: GoogleAPIClient;
  private maxResults = 20;
  private initialized = false;
  
  private constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
  }
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Initialize the email service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const { useMock } = getEnv();
    
    if (!useMock) {
      await this.googleClient.initialize();
    }
    
    this.initialized = true;
  }
  
  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.googleClient.isSignedIn();
  }
  
  /**
   * Get emails with pagination
   */
  async getEmails(options: EmailOptions = {}): Promise<EmailResponse> {
    const { useMock } = getEnv();
    
    console.log('EmailService: Fetching emails with options:', options);
    
    if (useMock) {
      console.log('EmailService: Using mock data');
      return this.getMockEmails(options);
    }
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check if signed in
    if (!this.isSignedIn()) {
      console.error('EmailService: User not signed in');
      throw new Error('User not signed in');
    }
    
    try {
      const { maxResults = this.maxResults, labelIds = ['INBOX'], q, pageToken } = options;
      
      console.log('EmailService: Making Gmail API request with params:', {
        maxResults,
        labelIds,
        q,
        pageToken
      });
      
      // Get message list
      const response = await this.googleClient.request<{
        messages: { id: string; threadId: string }[];
        nextPageToken?: string;
        resultSizeEstimate: number;
      }>({
        path: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        params: {
          maxResults,
          labelIds,
          q,
          pageToken
        }
      });
      
      console.log('EmailService: Received response:', {
        messageCount: response.messages?.length || 0,
        hasNextPage: !!response.nextPageToken,
        totalResults: response.resultSizeEstimate
      });
      
      // If no messages, return empty array
      if (!response.messages || response.messages.length === 0) {
        console.log('EmailService: No messages found');
        return {
          messages: [],
          nextPageToken: null,
          resultSizeEstimate: 0
        };
      }
      
      // Get message details in parallel but limit concurrency
      const emailPromises = response.messages.map(
        (message) => this.getEmailDetails(message.id)
      );
      
      const emails = await Promise.all(emailPromises);
      
      console.log('EmailService: Successfully fetched', emails.filter(Boolean).length, 'emails');
      
      return {
        messages: emails.filter(Boolean) as EmailMessage[],
        nextPageToken: response.nextPageToken || null,
        resultSizeEstimate: response.resultSizeEstimate
      };
    } catch (error) {
      console.error('EmailService: Failed to fetch emails:', error);
      throw error;
    }
  }
  
  /**
   * Get a single email by ID
   */
  async getEmail(id: string): Promise<EmailMessage | null> {
    const { useMock } = getEnv();
    
    // Mock data for development
    if (useMock) {
      return this.getMockEmailDetails(id);
    }
    
    return this.getEmailDetails(id);
  }
  
  /**
   * Get email details
   */
  private async getEmailDetails(id: string): Promise<EmailMessage | null> {
    try {
      // Fetch the full message
      const message = await this.googleClient.request<any>({
        path: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
        params: { format: 'full' }
      });
      
      if (!message || !message.payload) {
        return null;
      }
      
      // Extract headers
      const headers = message.payload.headers || [];
      const subject = this.findHeader(headers, 'Subject') || '(No Subject)';
      const from = this.findHeader(headers, 'From') || '';
      const to = this.findHeader(headers, 'To') || '';
      const date = this.findHeader(headers, 'Date') || '';
      
      // Get labels
      const labels = message.labelIds || [];
      
      // Process body
      let body = '';
      
      // Check if plain text part exists
      if (message.payload.body && message.payload.body.data) {
        body = this.decodeBase64(message.payload.body.data);
      } else if (message.payload.parts) {
        // Find HTML or text part
        const htmlPart = message.payload.parts.find(
          (part: any) => part.mimeType === 'text/html'
        );
        const textPart = message.payload.parts.find(
          (part: any) => part.mimeType === 'text/plain'
        );
        
        const part = htmlPart || textPart;
        if (part && part.body && part.body.data) {
          body = this.decodeBase64(part.body.data);
        }
      }
      
      // Check for attachments
      const hasAttachments = this.hasAttachments(message.payload);
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body,
        snippet: message.snippet || '',
        labels,
        attachments: hasAttachments,
        isRead: !labels.includes('UNREAD'),
        isStarred: labels.includes('STARRED'),
        isImportant: labels.includes('IMPORTANT')
      };
    } catch (error) {
      console.error(`Failed to fetch email details for ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Find a header in the headers array
   */
  private findHeader(headers: any[], name: string): string | null {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }
  
  /**
   * Decode base64 encoded string
   */
  private decodeBase64(data: string): string {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (error) {
      console.error('Failed to decode base64:', error);
      return '';
    }
  }
  
  /**
   * Check if message has attachments
   */
  private hasAttachments(payload: any): boolean {
    if (!payload) return false;
    
    // Check current part
    if (payload.mimeType && payload.mimeType.startsWith('application/') && payload.body && payload.body.attachmentId) {
      return true;
    }
    
    // Check child parts recursively
    if (payload.parts && payload.parts.length > 0) {
      return payload.parts.some((part: any) => this.hasAttachments(part));
    }
    
    return false;
  }
  
  /**
   * Get mock emails for development
   */
  private getMockEmails(options: EmailOptions = {}): EmailResponse {
    const { maxResults = this.maxResults } = options;
    
    const mockEmails: EmailMessage[] = Array.from({ length: maxResults }).map((_, i) => ({
      id: `mock-email-${i}`,
      threadId: `mock-thread-${i}`,
      subject: `Mock Email Subject ${i}`,
      from: `Mock Sender ${i} <sender${i}@example.com>`,
      to: 'you@example.com',
      date: new Date(Date.now() - i * 3600000).toISOString(),
      body: `<p>This is the body of mock email ${i}.</p><p>It contains multiple paragraphs.</p>`,
      snippet: `This is the snippet of mock email ${i}...`,
      labels: ['INBOX', i % 2 === 0 ? 'UNREAD' : ''],
      attachments: i % 3 === 0,
      isRead: i % 2 !== 0,
      isStarred: i % 5 === 0,
      isImportant: i % 4 === 0
    }));
    
    return {
      messages: mockEmails,
      nextPageToken: null,
      resultSizeEstimate: mockEmails.length
    };
  }
  
  /**
   * Get mock email details for development
   */
  private getMockEmailDetails(id: string): EmailMessage {
    const index = parseInt(id.replace('mock-email-', '')) || 0;
    
    return {
      id,
      threadId: `mock-thread-${index}`,
      subject: `Mock Email Subject ${index}`,
      from: `Mock Sender ${index} <sender${index}@example.com>`,
      to: 'you@example.com',
      date: new Date(Date.now() - index * 3600000).toISOString(),
      body: `<p>This is the body of mock email ${index}.</p><p>It contains multiple paragraphs.</p>`,
      snippet: `This is the snippet of mock email ${index}...`,
      labels: ['INBOX', index % 2 === 0 ? 'UNREAD' : ''],
      attachments: index % 3 === 0,
      isRead: index % 2 !== 0,
      isStarred: index % 5 === 0,
      isImportant: index % 4 === 0
    };
  }

  async getAccounts(): Promise<EmailAccount[]> {
    const { useMock } = getEnv();
    
    if (useMock) {
      return [{
        id: 'mock-account-1',
        email: 'mock@example.com',
        provider: 'google',
        name: 'Mock Account'
      }];
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // Real implementation for getting accounts
    try {
      const response = await this.googleClient.request<any>('/gmail/v1/users/me/profile');
      return [{
        id: response.emailAddress,
        email: response.emailAddress,
        provider: 'google',
        name: response.emailAddress.split('@')[0]
      }];
    } catch (error) {
      console.error('EmailService: Failed to get accounts:', error);
      throw error;
    }
  }
}

// Export singleton instance
const emailService = EmailService.getInstance();
export default emailService; 