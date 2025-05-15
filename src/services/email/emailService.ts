/**
 * Email Service
 * 
 * Handles fetching and processing of emails from Gmail API
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from '../google/GoogleAPIClient';
import googleAuthService from '../auth/googleAuth';
import { EmailAccount, EmailMessage, EmailQuery, EmailAnalysis, EmailAnalysisMeetingDetails } from './types';
import { supabase } from '@/lib/supabase';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { AIService } from '../ai/baseAIService';
import { googleApiClient } from '../google/GoogleAPIClient';
import { aiCalendarService } from '../calendar/AiCalendarService';

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
    console.log('EmailService: Fetching emails with options:', options);
    
    if (this.googleClient.isUsingMockData()) {
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
    
    if (this.googleClient.isUsingMockData()) {
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
        console.error(`EmailService: No message payload for ID ${id}`);
        return null;
      }
      
      // Log the raw payload for debugging, especially for attachment issues
      // console.log(`EmailService: Raw message payload for ${id}:`, JSON.stringify(message.payload, null, 2));
      
      const headers = message.payload.headers || [];
      const subject = this.findHeader(headers, 'Subject') || '(No Subject)';
      const from = this.findHeader(headers, 'From') || '';
      const to = this.findHeader(headers, 'To') || '';
      const date = this.findHeader(headers, 'Date') || '';
      const labels = message.labelIds || [];
      let body = '';
      let bodyMimeType = 'text/plain'; // Default MIME type

      if (message.payload.parts) {
          const htmlPart = message.payload.parts.find((part: any) => part.mimeType === 'text/html');
          const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          
          if (htmlPart?.body?.data) { 
            body = this.decodeBase64(htmlPart.body.data); 
            bodyMimeType = 'text/html';
          } else if (textPart?.body?.data) { 
            body = this.decodeBase64(textPart.body.data); 
            bodyMimeType = 'text/plain';
          }
      } else if (message.payload.body?.data) {
          // This case is usually for non-multipart messages or simple text emails
          body = this.decodeBase64(message.payload.body.data);
          bodyMimeType = message.payload.mimeType || 'text/plain'; 
      }

      const attachmentsList = this.extractAttachments(message.payload);

      // If body is still empty and there's an HTML attachment, try to use its content for analysis
      if (!body && attachmentsList) {
        const htmlAttachment = attachmentsList.find(att => att.mimeType === 'text/html' && att.attachmentId);
        if (htmlAttachment) {
          console.log(`EmailService: Body is empty for ${id}, attempting to use HTML attachment content.`);
          // Log the raw payload specifically when we hit this condition to understand its structure
          console.log(`EmailService: Raw message payload for ${id} (due to empty body with HTML attachment):`, JSON.stringify(message.payload, null, 2));
          try {
            // Fetch the attachment content
            const attachmentPath = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${htmlAttachment.attachmentId}`;
            const attachmentResponse = await this.googleClient.request<{ data: string }>(attachmentPath, { method: 'GET' });
            if (attachmentResponse && attachmentResponse.data) {
              body = this.decodeBase64(attachmentResponse.data);
              bodyMimeType = 'text/html'; // Assume it's HTML
              console.log(`EmailService: Successfully used HTML attachment content as body for ${id}. Body length: ${body.length}`);
            } else {
              console.warn(`EmailService: Failed to fetch content for HTML attachment ${htmlAttachment.attachmentId} for email ${id}.`);
            }
          } catch (attFetchError) {
            console.error(`EmailService: Error fetching HTML attachment ${htmlAttachment.attachmentId} for email ${id}:`, attFetchError);
          }
        }
      }
      
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
        important: labels.includes('IMPORTANT'),
        bodyMimeType
      };

      // REMOVED the immediate call to this.analyzeEmail(emailMessage) from here.
      // Analysis should be triggered by the caller of getEmailDetails if desired.
      
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
      // MODIFIED: Use atob for browser environments
      // Replace URL-safe characters just in case, then decode
      const safeData = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(safeData)));
    } catch (error) {
      console.error('Error decoding base64 string:', error, 'Input data:', data.substring(0, 100) + '...'); // Log part of the problematic data
      // Fallback or re-throw, depending on desired behavior.
      // Returning an empty string or a placeholder might be safer than throwing an error
      // if some emails might have malformed base64 content.
      return '[Error: Could not decode email content]'; 
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
    const { pageSize = this.maxResults, folderId, search, labelId } = options;
    const currentFolder = folderId || labelId || 'INBOX'; // Determine current folder for prefixing

    const mockMessages: EmailMessage[] = Array.from({ length: pageSize }).map((_, i) => ({
      id: `mock_${currentFolder}_${i}_${Date.now()}`,
      threadId: `thread_mock_${currentFolder}_${i}`,
      subject: `[${currentFolder}] Mock Subject ${i + 1}`,
      from: `${currentFolder.toLowerCase()}_sender${i}@example.com`,
      to: 'user@example.com',
      date: new Date(Date.now() - i * 3600000).toISOString(),
      body: `This is the mock body for email ${i + 1} in folder ${currentFolder}. Query: ${search || 'N/A'}`,
      snippet: `Mock snippet ${i + 1} from folder ${currentFolder}`,
      labels: [currentFolder, i % 3 === 0 ? 'UNREAD' : 'READ', i % 5 === 0 ? 'STARRED' : ''].filter(Boolean),
      attachments: i % 4 === 0 ? [{ filename: `mock_attachment_${currentFolder}_${i}.pdf`}] : undefined,
      read: i % 3 !== 0,
      starred: i % 5 === 0,
      important: i % 7 === 0 
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
    const parts = id.split('_');
    const currentFolder = parts.length > 3 ? parts[1] : 'INBOX'; // Extract folder name, default to INBOX
    const i = parseInt(parts.length > 3 ? parts[2] : (parts[1] || '0')); // Extract index

    // Define a mock analysis object
    const mockAnalysis: EmailAnalysis = {
      messageId: id,
      priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
      category: 'General Mock',
      sentiment: i % 2 === 0 ? 'positive' : 'neutral',
      actionItems: [`Mock action for ${id} - item 1`, `Mock action for ${id} - item 2`],
      summary: `This is a generated mock summary for email ${id}. It highlights key mock points and suggests mock actions.`,
      keywords: ['mock', 'email', `id-${i}`, currentFolder.toLowerCase()],
      isReplyRequired: i % 4 !== 0, // Mostly true, sometimes false
      suggestedReply: i % 4 !== 0 ? `Thanks for the mock email ${id} from ${currentFolder}!` : undefined,
      followUpDate: i % 5 === 0 ? new Date(Date.now() + 24 * 3600000).toISOString() : undefined, // Follow up tomorrow sometimes
      meetingDetails: i % 6 === 0 ? {
        eventDate: new Date(Date.now() + 2 * 24 * 3600000).toISOString().split('T')[0],
        eventTime: new Date(Date.now() + (2 * 24 + 1) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        endTime: new Date(Date.now() + (2 * 24 + 1) * 3600000).toISOString(),
        location: 'Mock Meeting Room',
        attendees: ['mock.attendee@example.com'],
        description: `Discuss mock project updates for ${currentFolder}.`
      } : undefined
    };

     return {
        id: id,
        threadId: `thread_mock_${currentFolder}_${i}`,
        subject: `[${currentFolder}] Mock Subject ${i + 1}`, // Consistent subject
        from: `${currentFolder.toLowerCase()}_sender${i}@example.com`, // Consistent sender
        to: 'user@example.com',
        date: new Date(Date.now() - i * 3600000).toISOString(),
        body: `This is the detailed mock body for email ${id} from folder ${currentFolder}. It might contain <strong>HTML</strong> content.`, 
        snippet: `Mock snippet ${i + 1} from folder ${currentFolder}`,
        labels: [currentFolder, i % 3 === 0 ? 'UNREAD' : 'READ', i % 5 === 0 ? 'STARRED' : ''].filter(Boolean), // Consistent labels
        attachments: i % 4 === 0 ? [{ filename: `mock_attachment_${currentFolder}_${i}.pdf`}] : undefined, // Consistent attachments
        read: i % 3 !== 0,
        starred: i % 5 === 0,
        important: i % 7 === 0, // Consistent with list view if important was based on i % 7
        analysis: mockAnalysis // Add the mock analysis here
     };
  }

  async getAccounts(): Promise<EmailAccount[]> {
    // MODIFIED: Rely on googleClient's mock status
    // const { useMock } = getEnv(); // REMOVED
    
    // if (useMock) { // REPLACED
    if (this.googleClient.isUsingMockData()) { // ADDED
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
    if (!email || !email.id || !email.body) {
      console.error('[EmailService] analyzeEmail: Cannot analyze email, missing id, or body content.');
      // Return a structured error in EmailAnalysis format
      return {
        messageId: email?.id || 'unknown',
        error: 'Cannot analyze email, missing id, or body content.',
        priority: 'low',
        category: 'error',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'Analysis failed due to missing email content.',
        keywords: [],
        calendarEventStatus: 'analysis_error',
        isMeeting: false, 
        isCourtDocument: undefined,
        isReplyRequired: undefined,
        suggestedReply: undefined,
        followUpDate: undefined,
        meetingDetails: undefined,
        rawAiResponse: undefined,
        calendarEventId: undefined,
        calendarEventError: undefined,
        calendarEventDetails: undefined,
      };
    }

    console.log(`[EmailService] Analyzing email ID ${email.id} with subject "${email.subject}"`);

    let analysisResult: EmailAnalysis = {
      messageId: email.id,
      priority: 'medium', 
      category: 'uncategorized',
      sentiment: 'neutral',
      actionItems: [],
      summary: '',
      keywords: [],
      isCourtDocument: undefined,
      isReplyRequired: undefined,
      suggestedReply: undefined,
      followUpDate: undefined,
      meetingDetails: undefined,
      rawAiResponse: null,
      calendarEventId: null,
      calendarEventStatus: 'pending_analysis',
      calendarEventError: null,
      error: undefined,
      calendarEventDetails: null,
      isMeeting: false, 
    };

    try {
      // Use the now declared interface method
      const aiCalendarAnalysis = await this.aiService.analyzeEmailForCalendarEvent(email);

      if (!aiCalendarAnalysis) {
        console.warn(`[EmailService] AI analysis for email ID ${email.id} returned null.`);
        analysisResult.summary = 'AI analysis returned no data.';
        analysisResult.error = 'AI analysis returned no data.';
        analysisResult.calendarEventStatus = 'analysis_error';
        return analysisResult;
      }

      // Merge results from aiCalendarAnalysis into our main analysisResult
      // Properties defined in EmailAnalysis that are returned by analyzeEmailForCalendarEvent should be directly assigned.
      analysisResult = {
        ...analysisResult, // Keep defaults for fields not in aiCalendarAnalysis
        ...aiCalendarAnalysis, // Overwrite with actual analysis data
        messageId: email.id, // Ensure messageId is always from the input email
        isMeeting: !!(aiCalendarAnalysis.meetingDetails && aiCalendarAnalysis.meetingDetails.eventDate && aiCalendarAnalysis.meetingDetails.eventTime),
      };
      analysisResult.rawAiResponse = aiCalendarAnalysis.rawAiResponse || aiCalendarAnalysis; // Store raw if available, else the object itself for now

      if (aiCalendarAnalysis.error) { // If the specialized AI method itself had an internal error it reported
        analysisResult.error = aiCalendarAnalysis.error;
        analysisResult.calendarEventStatus = 'analysis_error';
        console.warn(`[EmailService] AI analysis for email ID ${email.id} reported an error: ${aiCalendarAnalysis.error}`);
        return analysisResult;
      }

      if (!analysisResult.isMeeting) {
        console.log(`[EmailService] Email ID ${email.id} is not identified as a meeting by AI.`);
        analysisResult.calendarEventStatus = 'no_actionable_meeting';
        return analysisResult; // Return early, no calendar operations needed
      }

      console.log(`[EmailService] Successfully performed AI analysis for email ID ${email.id}.`);
      analysisResult.calendarEventStatus = 'ai_analysis_complete';

      const meetingDetails = analysisResult.meetingDetails; // Should be populated from aiCalendarAnalysis

      // Calendar operations logic (remains largely the same, but uses populated analysisResult)
      if (meetingDetails && meetingDetails.eventDate && meetingDetails.eventTime) {
        console.log(`[EmailService] Found meeting details for email ID ${email.id}. Proceeding with calendar logic.`);
        const caseNumber = meetingDetails.caseNumber;
        let existingEvent = null;

        if (caseNumber) {
          console.log(`[EmailService] Email ID ${email.id} has case number ${caseNumber}. Checking for existing event.`);
          existingEvent = await aiCalendarService.findEventByCaseNumber(caseNumber);
        }

        if (existingEvent) {
          console.log(`[EmailService] Found existing event ID ${existingEvent.id} for case ${caseNumber}. Attempting to update.`);
          analysisResult.calendarEventStatus = 'pending_update';
          try {
            const updatedEvent = await aiCalendarService.updateEvent(
              existingEvent.id,
              meetingDetails,
              email.subject || 'Updated Event',
            email.id,
            email.threadId
          );
            if (updatedEvent) {
              console.log(`[EmailService] Successfully updated calendar event for email ID ${email.id}. Event ID: ${updatedEvent.id}`);
              analysisResult.calendarEventId = updatedEvent.id;
              analysisResult.calendarEventDetails = updatedEvent; 
              analysisResult.calendarEventStatus = 'updated';
            } else {
              console.warn(`[EmailService] Failed to update calendar event for email ID ${email.id}. aiCalendarService.updateEvent returned null.`);
              analysisResult.calendarEventError = 'Failed to update event in calendar (service returned null).';
              analysisResult.calendarEventStatus = 'update_failed';
            }
          } catch (calendarUpdateError: any) {
            console.error(`[EmailService] Error updating calendar event for email ID ${email.id}:`, calendarUpdateError);
            analysisResult.calendarEventError = calendarUpdateError.message || 'Unknown error updating calendar event.';
            analysisResult.calendarEventStatus = 'update_failed';
          }
        } else {
          if (caseNumber) {
            console.log(`[EmailService] No existing event found for case ${caseNumber}. Attempting to create new event.`);
          } else {
            console.log(`[EmailService] No case number found. Attempting to create new event for email ID ${email.id}.`);
          }
          analysisResult.calendarEventStatus = 'pending_creation';
          try {
            const newEvent = await aiCalendarService.createEventFromAnalysis(
              meetingDetails,
              email.subject || 'New Event from Email',
              email.id,
              email.threadId
            );
            if (newEvent) {
              console.log(`[EmailService] Successfully created new calendar event for email ID ${email.id}. Event ID: ${newEvent.id}`);
              analysisResult.calendarEventId = newEvent.id;
              analysisResult.calendarEventDetails = newEvent; 
              analysisResult.calendarEventStatus = 'created';
            } else {
              console.warn(`[EmailService] Could not create calendar event for email ID ${email.id}. aiCalendarService.createEventFromAnalysis returned null.`);
              analysisResult.calendarEventError = 'Failed to create event in calendar (service returned null).';
              analysisResult.calendarEventStatus = 'creation_failed';
            }
          } catch (calendarCreateError: any) {
            console.error(`[EmailService] Error creating calendar event for email ID ${email.id}:`, calendarCreateError);
            analysisResult.calendarEventError = calendarCreateError.message || 'Unknown error creating calendar event.';
            analysisResult.calendarEventStatus = 'creation_failed';
          }
        }
      } else {
        console.log(`[EmailService] No actionable meeting details (eventDate, eventTime) found for email ID ${email.id}.`);
        analysisResult.calendarEventStatus = 'no_actionable_meeting_details';
        // This was already correctly setting isMeeting to false if details were missing, so this path is fine.
      }
    } catch (aiInterfaceError: any) {
      // This catch block is for errors from the call to this.aiService.analyzeEmailForCalendarEvent itself (e.g., if the method throws)
      console.error(`[EmailService] Error calling AI service analyzeEmailForCalendarEvent for email ID ${email.id}:`, aiInterfaceError);
      analysisResult.error = aiInterfaceError.message || 'Error in AI service call.';
      analysisResult.summary = analysisResult.summary || 'AI analysis service call failed.'; 
      analysisResult.calendarEventStatus = 'analysis_error';
    }

    return analysisResult;
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<any> {
    console.log(`[EmailService] Attempting to send email to: ${to} with subject: ${subject}`);

    // Ensure GoogleAPIClient is initialized. Initialize is idempotent.
    // Provide a default onAuthChange or use one from your app's context if available.
    await googleApiClient.initialize(() => {}); 

    // Ensure user is signed in and has consented to necessary scopes (including gmail.send)
    // signIn() will request token and trigger consent if needed, and is also idempotent if already signed in.
    await googleApiClient.signIn();
    
    // Check again after attempting sign-in, as signIn itself doesn't throw an error on failure to get token,
    // but updates isAuthenticated state which isSignedIn() reflects.
    if (!googleApiClient.isSignedIn()) {
        console.error('[EmailService] Google Sign-In failed or user not authenticated. Cannot send email.');
        throw new Error('Google Sign-In/Authentication required to send email.');
    }
    
    let fromEmail = 'me'; // Default to 'me' for the API user ID
    try {
        // Attempt to get the actual user email for the 'From' header for clarity, though Gmail API uses authenticated user.
        const userInfo = await googleApiClient.getUserInfo();
        if (userInfo && userInfo.email) {
            fromEmail = userInfo.email; 
        } else {
            console.warn('[EmailService] Could not retrieve user email for From header. Gmail will use authenticated user.');
        }
    } catch (error) {
        console.warn('[EmailService] Error fetching user info for From header. Gmail will use authenticated user.', error);
    }

    // Construct the raw email message (RFC 2822 format)
    const emailLines = [];
    // The From header should ideally be the authenticated user's email address.
    // Using the variable `fromEmail` which defaults to 'me' if userInfo.email isn't fetched.
    // For the Gmail API `users/me/messages/send` endpoint, the authenticated user is implied.
    // Some strict RFC interpretations might want a full email here, but Gmail is often flexible.
    emailLines.push(`From: <${fromEmail}>`); 
    emailLines.push(`To: <${to}>`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('MIME-Version: 1.0');
    emailLines.push(''); // Blank line separates headers from body
    emailLines.push(htmlBody);

    const rawEmail = emailLines.join('\r\n');

    const base64EncodedEmail = btoa(rawEmail)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      console.log('[EmailService] Sending raw email via Gmail API.');
      const response = await googleApiClient.request<any>(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          body: JSON.stringify({ raw: base64EncodedEmail }),
        }
      );
      console.log('[EmailService] Email sent successfully. Response:', response);
      return response;
    } catch (error) {
      console.error('[EmailService] Error sending email via Gmail API:', error);
      throw error; 
    }
  }
}

// Export singleton instance
const emailService = EmailService.getInstance();
export default emailService; 