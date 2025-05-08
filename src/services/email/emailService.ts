/**
 * Email Service
 * 
 * Handles fetching and processing of emails from Gmail API
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from '../google/GoogleAPIClient';
import googleAuthService from '../auth/googleAuth';
import { EmailAccount, EmailMessage, EmailQuery, EmailAnalysis } from './types';
import { supabase } from '@/lib/supabase';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { AIService } from '../ai/baseAIService';

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
  private aiService: AIService;
  
  private constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
    this.aiService = AIServiceFactory.getInstance();
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
  async isSignedIn(): Promise<boolean> {
    return await googleAuthService.isSignedIn();
  }
  
  /**
   * Get emails with pagination
   */
  async getEmails(options: EmailQuery = {}): Promise<EmailResponse> {
    const { useMock } = getEnv();
    
    console.log('EmailService: Fetching emails with options:', options);
    
    if (useMock) {
      console.log('EmailService: Using mock data');
      return this.getMockEmails(options);
    }
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!await this.isSignedIn()) {
      console.error('EmailService: User not signed in');
      throw new Error('User not signed in');
    }
    
    try {
      const { pageSize = this.maxResults, labelId, folderId, search, pageToken } = options;
      const labelIdsParam = labelId ? [labelId] : (folderId ? [folderId] : ['INBOX']);
      
      let path = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
      const queryParams = new URLSearchParams();
      queryParams.append('maxResults', pageSize.toString());
      if (labelIdsParam) {
        labelIdsParam.forEach(lId => queryParams.append('labelIds', lId));
      }
      if (search) {
        queryParams.append('q', search);
      }
      if (pageToken) {
        queryParams.append('pageToken', pageToken);
      }
      path += `?${queryParams.toString()}`;

      console.log('EmailService: Making Gmail API request with path:', path);
      
      const response = await this.googleClient.request<{
        messages: { id: string; threadId: string }[];
        nextPageToken?: string;
        resultSizeEstimate: number;
      }>(path, { method: 'GET' });
      
      console.log('EmailService: Received response:', {
        messageCount: response.messages?.length || 0,
        hasNextPage: !!response.nextPageToken,
        totalResults: response.resultSizeEstimate
      });
      
      if (!response.messages || response.messages.length === 0) {
        console.log('EmailService: No messages found');
        return {
          messages: [],
          nextPageToken: null,
          resultSizeEstimate: 0
        };
      }
      
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
    console.log('EmailService: getEmail called with ID:', id);
    const { useMock } = getEnv();
    
    if (useMock) {
      return this.getMockEmailDetails(id);
    }
    
    if (!this.initialized || !await this.isSignedIn()) {
       throw new Error('Service not initialized or user not signed in');
    }
    return this.getEmailDetails(id);
  }
  
  /**
   * Get email details
   */
  private async getEmailDetails(id: string): Promise<EmailMessage | null> {
    console.log('EmailService: getEmailDetails called with ID:', id);
    try {
      const path = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
      const message = await this.googleClient.request<any>(
        path,
        { method: 'GET' }
      );
      
      if (!message || !message.payload) {
        return null;
      }
      
      const headers = message.payload.headers || [];
      const subject = this.findHeader(headers, 'Subject') || '(No Subject)';
      const from = this.findHeader(headers, 'From') || '';
      const to = this.findHeader(headers, 'To') || '';
      const date = this.findHeader(headers, 'Date') || '';
      const labels = message.labelIds || [];
      let body = '';

      if (message.payload.parts) {
          const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          const htmlPart = message.payload.parts.find((part: any) => part.mimeType === 'text/html');
          if (htmlPart?.body?.data) { body = this.decodeBase64(htmlPart.body.data); }
          else if (textPart?.body?.data) { body = this.decodeBase64(textPart.body.data); }
      } else if (message.payload.body?.data) {
          body = this.decodeBase64(message.payload.body.data);
      }

      const attachmentsList = this.extractAttachments(message.payload);
      
      const emailMessage: EmailMessage = {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body,
        snippet: message.snippet || '',
        labels,
        attachments: attachmentsList,
        read: !labels.includes('UNREAD'),
        starred: labels.includes('STARRED'),
        important: labels.includes('IMPORTANT')
      };

      // Analyze the email after fetching its details
      try {
        const analysis = await this.analyzeEmail(emailMessage);
        if (analysis) {
          emailMessage.analysis = analysis;
        } else {
          console.warn(`EmailService: Analysis returned null for email ID ${emailMessage.id}`);
        }
      } catch (analysisError) {
        console.error(`EmailService: Error during email analysis integration for ID ${emailMessage.id}:`, analysisError);
        // Decide if you want to return the email without analysis or null/throw error
      }
      
      return emailMessage;
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
      return Buffer.from(data, 'base64').toString('utf-8');
    } catch (e) {
      console.error('Error decoding base64 string:', e);
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
  private getMockEmails(options: EmailQuery = {}): EmailResponse {
    const { pageSize = this.maxResults } = options;
    
    const mockMessages: EmailMessage[] = Array.from({ length: pageSize }).map((_, i) => ({
      id: `mock_${i}_${Date.now()}`,
      threadId: `thread_mock_${i}`,
      subject: `Mock Subject ${i + 1}`,
      from: `sender${i}@example.com`,
      to: 'user@example.com',
      date: new Date(Date.now() - i * 3600000).toISOString(),
      body: `This is the mock body for email ${i + 1}. Query: ${options.search || 'N/A'}`,
      snippet: `Mock snippet ${i + 1}`,
      labels: [options.folderId || options.labelId || 'INBOX', i % 3 === 0 ? 'UNREAD' : 'READ', i % 5 === 0 ? 'STARRED' : ''].filter(Boolean),
      attachments: i % 4 === 0 ? [{ filename: 'mock.pdf'}] : undefined,
      read: i % 3 !== 0,
      starred: i % 5 === 0,
      important: false
    }));
    
    return {
      messages: mockMessages,
      nextPageToken: `mock_page_${Date.now()}`,
      resultSizeEstimate: 50
    };
  }
  
  /**
   * Get mock email details for development
   */
  private getMockEmailDetails(id: string): EmailMessage {
    const i = parseInt(id.split('_')[1] || '0');

    // Define a mock analysis object
    const mockAnalysis: EmailAnalysis = {
      messageId: id,
      priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
      category: 'General Mock',
      sentiment: i % 2 === 0 ? 'positive' : 'neutral',
      actionItems: [`Mock action for ${id} - item 1`, `Mock action for ${id} - item 2`],
      summary: `This is a generated mock summary for email ${id}. It highlights key mock points and suggests mock actions.`,
      keywords: ['mock', 'email', `id-${i}`],
      isReplyRequired: i % 4 !== 0, // Mostly true, sometimes false
      suggestedReply: i % 4 !== 0 ? `Thanks for the mock email ${id}!` : undefined,
      followUpDate: i % 5 === 0 ? new Date(Date.now() + 24 * 3600000).toISOString() : undefined, // Follow up tomorrow sometimes
      meetingDetails: i % 6 === 0 ? {
        startTime: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
        endTime: new Date(Date.now() + (2 * 24 + 1) * 3600000).toISOString(),
        location: 'Mock Meeting Room',
        attendees: ['mock.attendee@example.com'],
        description: 'Discuss mock project updates.'
      } : undefined
    };

     return {
        id: id,
        threadId: `thread_mock_${i}`,
        subject: `Mock Subject ${i + 1}`,
        from: `sender${i}@example.com`,
        to: 'user@example.com',
        date: new Date(Date.now() - i * 3600000).toISOString(),
        body: `This is the detailed mock body for email ${id}. It might contain <strong>HTML</strong> content.`, 
        snippet: `Mock snippet ${i + 1}`,
        labels: ['INBOX', i % 3 === 0 ? 'UNREAD' : 'READ', i % 5 === 0 ? 'STARRED' : ''].filter(Boolean),
        attachments: i % 4 === 0 ? [{ filename: 'mock.pdf'}] : undefined,
        read: i % 3 !== 0,
        starred: i % 5 === 0,
        important: false,
        analysis: mockAnalysis // Add the mock analysis here
     };
  }

  async getAccounts(): Promise<EmailAccount[]> {
    const { useMock } = getEnv();
    
    if (useMock) {
      return [{
        id: 'mock-account-1',
        email: 'mock@example.com',
        provider: 'gmail',
        name: 'Mock Account'
      }];
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // Real implementation for getting accounts
    try {
      const response = await this.googleClient.request<any>('/gmail/v1/users/me/profile', { method: 'GET' });
      return [{
        id: response.emailAddress,
        email: response.emailAddress,
        provider: 'gmail',
        name: response.emailAddress.split('@')[0]
      }];
    } catch (error) {
      console.error('EmailService: Failed to get accounts:', error);
      throw error;
    }
  }

  /**
   * Send an email message.
   * 
   * @param messageData Object containing to, cc, bcc, subject, body
   */
  async sendMessage(messageData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string; // Assuming body is HTML for now
    // TODO: Add attachment handling
  }): Promise<void> {
    const { useMock } = getEnv();
    
    if (useMock) {
      console.log('EmailService (Mock): Sending email:', messageData);
      return;
    }

    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Not initialized or signed in');
    }
    
    // Attempt to get user email from auth service
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user?.email) {
      console.error('EmailService: Could not determine sender email address. Session error or missing email.', sessionError);
      throw new Error('Could not determine sender email address.');
    }
    const currentUserEmail = session.user.email;

    // Helper to format addresses
    const formatAddresses = (addresses: string | string[] | undefined): string => {
      if (!addresses) return '';
      return Array.isArray(addresses) ? addresses.join(', ') : addresses;
    };

    // Construct the raw email message (RFC 2822 format)
    const mail = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `Content-Transfer-Encoding: 7bit`, // Or base64 if body needs it
      `to: ${formatAddresses(messageData.to)}`,
      messageData.cc ? `cc: ${formatAddresses(messageData.cc)}` : null,
      messageData.bcc ? `bcc: ${formatAddresses(messageData.bcc)}` : null,
      `from: ${currentUserEmail}`,
      `subject: =?utf-8?B?${Buffer.from(messageData.subject).toString('base64' )}?=`,
      '',
      messageData.body
    ].filter(Boolean).join('\r\n'); // Use CRLF line endings

    // Base64Url encode the raw message
    const base64EncodedEmail = Buffer.from(mail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
      console.log('EmailService: Sending email via Gmail API...');
      await this.googleClient.request<any>(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: base64EncodedEmail })
        }
      );
      console.log('EmailService: Email sent successfully.');
    } catch (error) {
      console.error('EmailService: Failed to send email:', error);
      throw error;
    }
  }

  // Updated attachment check to return a list (basic structure)
  private extractAttachments(payload: any): any[] | undefined {
      let attachments: any[] = [];
      const parts = payload.parts || [];
  
      for (const part of parts) {
          if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
              attachments.push({
                  filename: part.filename,
                  mimeType: part.mimeType,
                  size: part.body.size,
                  attachmentId: part.body.attachmentId
                  // We would need another API call to fetch the actual attachment data using attachmentId
              });
          }
          // Recursively check nested parts for multipart messages
          if (part.parts) {
              const nestedAttachments = this.extractAttachments(part);
              if (nestedAttachments) {
                  attachments = attachments.concat(nestedAttachments);
              }
          }
      }
      
      // Also check top-level body if not multipart
      if (!payload.parts && payload.filename && payload.filename.length > 0 && payload.body?.attachmentId) {
           attachments.push({
                  filename: payload.filename,
                  mimeType: payload.mimeType,
                  size: payload.body.size,
                  attachmentId: payload.body.attachmentId
            });
      }
  
      return attachments.length > 0 ? attachments : undefined;
  }

  /**
   * Analyze an email using the AI service to extract insights.
   * @param email The email message to analyze.
   * @returns A promise that resolves to an EmailAnalysis object or null if analysis fails.
   */
  public async analyzeEmail(email: EmailMessage): Promise<EmailAnalysis | null> {
    if (!email || !email.body) {
      console.error('EmailService: Cannot analyze email, no body content.');
      return null;
    }

    const prompt = `
Given the following email content:

Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body:
${email.body}

Please analyze this email and provide the following information in a VALID JSON string format:
{
  "summary": "A concise summary of the email content (2-3 sentences).",
  "actionItems": ["An array of distinct action items or tasks mentioned. If none, provide an empty array."],
  "sentiment": "The overall sentiment ('positive', 'negative', 'neutral', 'urgent').",
  "keywords": ["An array of 5-7 most relevant keywords or key phrases."],
  "priority": "A suggested priority ('low', 'medium', 'high') based on content and urgency.",
  "isReplyRequired": "A boolean value (true or false) indicating if a reply appears to be requested."
}

Ensure the output is ONLY the JSON object, with no other text before or after it.
Action items should be specific and actionable.
Keywords should be relevant and concise.
`;

    try {
      console.log(`EmailService: Analyzing email ID ${email.id} with subject "${email.subject}"`);
      const rawAnalysis = await this.aiService.getCompletion(prompt, {
        // Consider adding options like maxTokens if needed, or model specification
      });

      if (!rawAnalysis) {
        console.error('EmailService: AI analysis returned empty response for email ID', email.id);
        return null;
      }

      // Attempt to parse the JSON string from the AI response
      let parsedAnalysis: any;
      try {
        // The AI might sometimes include markdown backticks around the JSON
        const cleanedResponse = rawAnalysis.replace(/^```json\s*|\s*```$/g, '');
        parsedAnalysis = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('EmailService: Failed to parse AI analysis JSON for email ID', email.id, parseError);
        console.error('Raw AI response was:', rawAnalysis); // Log the raw response for debugging
        // Optionally, try to extract parts with regex if JSON is consistently malformed,
        // or return null / a partial analysis object.
        return null;
      }
      
      // Validate and structure the parsed data into EmailAnalysis type
      // Basic validation to ensure all expected fields are present
      const requiredFields: Array<keyof EmailAnalysis> = ['summary', 'actionItems', 'sentiment', 'keywords', 'priority', 'isReplyRequired'];
      for (const field of requiredFields) {
        if (parsedAnalysis[field] === undefined) {
          console.warn(`EmailService: AI analysis for email ID ${email.id} missing field: ${field}. Raw:`, parsedAnalysis);
          // Decide how to handle missing fields: return null, or an analysis object with missing parts?
          // For now, let's be strict and expect all fields.
        }
      }

      const analysisResult: EmailAnalysis = {
        messageId: email.id,
        summary: parsedAnalysis.summary || 'Summary not available.',
        actionItems: Array.isArray(parsedAnalysis.actionItems) ? parsedAnalysis.actionItems : [],
        sentiment: parsedAnalysis.sentiment || 'neutral',
        keywords: Array.isArray(parsedAnalysis.keywords) ? parsedAnalysis.keywords : [],
        priority: parsedAnalysis.priority || 'medium',
        isReplyRequired: typeof parsedAnalysis.isReplyRequired === 'boolean' ? parsedAnalysis.isReplyRequired : false,
        // category, meetingDetails, suggestedReply, followUpDate would be new features or derived
        category: parsedAnalysis.category || '', // If Gemini can provide this
        // For meetingDetails, suggestedReply, followUpDate, Gemini might need more specific prompting
        // or these could be derived/handled by separate logic post-analysis.
      };
      
      console.log(`EmailService: Successfully analyzed email ID ${email.id}`);
      return analysisResult;

    } catch (error) {
      console.error('EmailService: Error during AI email analysis for ID', email.id, error);
      return null;
    }
  }
}

// Export singleton instance
const emailService = EmailService.getInstance();
export default emailService; 