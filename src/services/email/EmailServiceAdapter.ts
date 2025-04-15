/**
 * Email Service Adapter
 * 
 * This adapter bridges the gap between the legacy EmailService interface
 * and the new implementation. It implements the same interface as the
 * original EmailService class but forwards calls to our new singleton.
 */

import { 
  EmailAccount, 
  EmailFolder, 
  EmailLabel, 
  EmailQuery, 
  IMAPConfig,
  EmailFilter,
  EmailPreferences,
  EmailMessage as TypesEmailMessage
} from './types';

import { 
  EmailMessage as ServiceEmailMessage,
  EmailResponse
} from './emailService';

import emailService from './emailService';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';
// Import GoogleAPIClient instead of GoogleAuthService for consistent OAuth handling
import { GoogleAPIClient } from "../google/GoogleAPIClient";

// Type conversion helper - converts from emailService.ts EmailMessage to types.ts EmailMessage
const convertEmailMessageType = (msg: ServiceEmailMessage): TypesEmailMessage => {
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: msg.subject,
    from: msg.from,
    to: typeof msg.to === 'string' ? msg.to : Array.isArray(msg.to) ? msg.to.join(', ') : '',
    date: msg.date,
    body: msg.body,
    snippet: msg.snippet,
    labels: msg.labels || [],
    read: msg.isRead || false,
    starred: msg.isStarred || false,
    attachments: Array.isArray(msg.attachments) ? msg.attachments : (msg.attachments ? [true] : [])
  };
};

// Reverse conversion - converts from types.ts EmailMessage to emailService.ts EmailMessage
const convertToServiceEmailMessage = (msg: Partial<TypesEmailMessage>): Partial<ServiceEmailMessage> => {
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: msg.subject,
    from: msg.from,
    to: msg.to || '',
    date: msg.date,
    body: msg.body,
    snippet: msg.snippet,
    labels: msg.labels || [],
    isRead: msg.read || false,
    isStarred: msg.starred || false,
    isImportant: msg.labels?.includes('IMPORTANT') || false,
    attachments: msg.attachments && msg.attachments.length > 0
  };
};

export class EmailService {
  private static instance: EmailService;
  private googleClient: GoogleAPIClient;
  
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
    await this.googleClient.initialize();
    return emailService.initialize();
  }
  
  // Account methods
  async getAccounts(): Promise<EmailAccount[]> {
    // Try to get the real user's email from auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        return [
          {
            id: 'gmail-account',
            provider: 'gmail',
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
            connected: this.googleClient.isSignedIn(),
            lastSynced: new Date()
          }
        ];
      }
    } catch (error) {
      console.error('Error getting user session:', error);
    }

    // Fallback to mock account if no session
    return [
      {
        id: 'mock-account-1',
        provider: 'gmail',
        email: 'user@gmail.com',
        name: 'Gmail Account',
        connected: true,
        lastSynced: new Date()
      }
    ];
  }
  
  async addGoogleAccount(code?: string): Promise<EmailAccount> {
    try {
      // Initialize the Google API client if not already done
      await this.googleClient.initialize();
      
      // If we have a token already, use it
      if (this.googleClient.isSignedIn()) {
        const userInfo = await this.googleClient.getUserInfo();
        
        return {
          id: `google-${Date.now()}`,
          provider: 'gmail',
          email: userInfo.email,
          name: userInfo.name,
          connected: true,
          lastSynced: new Date()
        };
      }
      
      // If we don't have a code, initiate the OAuth flow via Supabase
      if (!code) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/email/connect/success',
            scopes: 'email profile https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send'
          }
        });
        
        if (error) {
          console.error('Error initiating Google OAuth:', error);
          throw new Error(`Failed to connect Gmail: ${error.message}`);
        }
        
        // The OAuth flow will redirect to the callback URL
        throw new Error('Redirecting to Google for authentication...');
      }
      
      // If we have a code but not executing in browser context, this is a backend call
      throw new Error('Code exchange should be handled by the backend OAuth callback');
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('Redirecting to Google') || 
           error.message.includes('authentication'))) {
        // This is expected - the OAuth flow is redirecting
        throw error;
      }
      console.error('Error adding Google account:', error);
      throw error;
    }
  }
  
  async addIMAPAccount(config: IMAPConfig): Promise<EmailAccount> {
    // Create a mock account for now
    return {
      id: `imap-${Date.now()}`,
      provider: 'imap',
      email: config.email,
      name: config.email, // Using email as name since config doesn't have a name field
      connected: true,
      lastSynced: new Date()
    };
  }
  
  async removeAccount(accountId: string): Promise<void> {
    // Nothing to do for now
    console.log(`Removing account ${accountId}`);
  }
  
  // Folder and label methods
  async getFolders(accountId: string): Promise<{ folders: EmailFolder[] }> {
    // Return mock folders
    return {
      folders: [
        { id: 'inbox', name: 'Inbox', type: 'system', unreadCount: 10, totalCount: 25 },
        { id: 'sent', name: 'Sent', type: 'system', unreadCount: 0, totalCount: 15 },
        { id: 'drafts', name: 'Drafts', type: 'system', unreadCount: 0, totalCount: 3 },
        { id: 'trash', name: 'Trash', type: 'system', unreadCount: 0, totalCount: 8 },
        { id: 'spam', name: 'Spam', type: 'system', unreadCount: 5, totalCount: 12 }
      ]
    };
  }
  
  async getLabels(accountId: string): Promise<{ labels: EmailLabel[] }> {
    // Return mock labels
    return {
      labels: [
        { id: 'important', name: 'Important', type: 'system', color: { backgroundColor: 'red' } },
        { id: 'work', name: 'Work', type: 'user', color: { backgroundColor: 'blue' } },
        { id: 'personal', name: 'Personal', type: 'user', color: { backgroundColor: 'green' } }
      ]
    };
  }
  
  // Message methods
  async getMessages(accountId: string, query: EmailQuery): Promise<{ messages: TypesEmailMessage[] }> {
    // Use our new emailService to get real messages
    try {
      const result = await emailService.getEmails({
        maxResults: query.pageSize || 20,
        labelIds: query.folderId ? [query.folderId] : ['INBOX'],
        q: query.search
      });
      
      // Convert the message type - use a regular function to avoid type errors with map
      const convertedMessages: TypesEmailMessage[] = [];
      for (const message of result.messages) {
        convertedMessages.push(convertEmailMessageType(message));
      }
      
      return { messages: convertedMessages };
    } catch (error) {
      console.error('Error getting messages:', error);
      // Return empty array on error
      return { messages: [] };
    }
  }
  
  async getMessage(accountId: string, messageId: string): Promise<{ message: TypesEmailMessage | null }> {
    // Use our new emailService to get the message
    try {
      const message = await emailService.getEmail(messageId);
      
      // Convert the message type if it exists
      const convertedMessage = message ? convertEmailMessageType(message) : null;
      
      return { message: convertedMessage };
    } catch (error) {
      console.error('Error getting message:', error);
      return { message: null };
    }
  }
  
  // Message actions
  async markAsRead(accountId: string, messageId: string): Promise<void> {
    console.log(`Marking message ${messageId} as read`);
  }
  
  async markAsUnread(accountId: string, messageId: string): Promise<void> {
    console.log(`Marking message ${messageId} as unread`);
  }
  
  async moveToFolder(accountId: string, messageId: string, folderId: string): Promise<void> {
    console.log(`Moving message ${messageId} to folder ${folderId}`);
  }
  
  async applyLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    console.log(`Applying label ${labelId} to message ${messageId}`);
  }
  
  async removeLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    console.log(`Removing label ${labelId} from message ${messageId}`);
  }
  
  async deleteMessage(accountId: string, messageId: string): Promise<void> {
    console.log(`Deleting message ${messageId}`);
  }
  
  async sendMessage(accountId: string, message: Partial<TypesEmailMessage>): Promise<void> {
    console.log(`Sending message from account ${accountId}:`, message);
  }
  
  async saveDraft(accountId: string, draft: Partial<TypesEmailMessage>): Promise<{ message: TypesEmailMessage }> {
    console.log(`Saving draft in account ${accountId}:`, draft);
    
    // Create a mock message
    return {
      message: {
        id: `draft-${Date.now()}`,
        threadId: `thread-${Date.now()}`,
        subject: draft.subject || '(No Subject)',
        from: draft.from || 'user@example.com',
        to: draft.to || '',
        date: new Date().toISOString(),
        body: draft.body || '',
        snippet: draft.snippet || '',
        labels: ['DRAFT'],
        read: true,
        starred: false,
        attachments: []
      }
    };
  }
  
  async refreshAccount(accountId: string): Promise<void> {
    console.log(`Refreshing account ${accountId}`);
  }
}

// Export singleton instance
const emailServiceAdapter = EmailService.getInstance();
export default emailServiceAdapter; 