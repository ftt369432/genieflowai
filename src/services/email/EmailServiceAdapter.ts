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
  EmailPreferences
} from './types';

import { 
  EmailMessage 
} from './emailService';

import emailService from './emailService';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';

export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
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
            name: session.user.user_metadata?.full_name || 'Gmail Account',
            connected: true,
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
    if (code) {
      // If we have a code, this is the callback from Google OAuth
      // Normally, this would exchange the code for tokens, but for now we'll mock it
      return {
        id: `google-${Date.now()}`,
        provider: 'gmail',
        email: useUserStore.getState().user?.email || 'user@gmail.com',
        name: useUserStore.getState().user?.fullName || 'Gmail Account',
        connected: true,
        lastSynced: new Date()
      };
    }
    
    // Start OAuth flow - fetch authorization URL from API
    try {
      const response = await fetch('/email/google/auth-url');
      const data = await response.json();
      
      if (data.url) {
        console.log('Opening Google authorization URL:', data.url);
        // Open the authorization URL in a new window/tab
        window.location.href = data.url;
        
        // This is a bit of a hack - we throw here to stop execution since we're redirecting
        throw new Error('Redirecting to Google for authorization');
      } else {
        throw new Error('Failed to get Google authorization URL');
      }
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      throw error;
    }
  }
  
  async addIMAPAccount(config: IMAPConfig): Promise<EmailAccount> {
    // Create a mock account for now
    return {
      id: `imap-${Date.now()}`,
      provider: 'imap',
      email: config.email,
      name: config.name || config.email,
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
        { id: 'inbox', name: 'Inbox', unreadCount: 10 },
        { id: 'sent', name: 'Sent', unreadCount: 0 },
        { id: 'drafts', name: 'Drafts', unreadCount: 0 },
        { id: 'trash', name: 'Trash', unreadCount: 0 },
        { id: 'spam', name: 'Spam', unreadCount: 5 }
      ]
    };
  }
  
  async getLabels(accountId: string): Promise<{ labels: EmailLabel[] }> {
    // Return mock labels
    return {
      labels: [
        { id: 'important', name: 'Important', color: 'red' },
        { id: 'work', name: 'Work', color: 'blue' },
        { id: 'personal', name: 'Personal', color: 'green' }
      ]
    };
  }
  
  // Message methods
  async getMessages(accountId: string, query: EmailQuery): Promise<{ messages: EmailMessage[] }> {
    // Use our new emailService to get real messages
    try {
      const result = await emailService.getEmails({
        maxResults: query.limit || 20,
        labelIds: query.folders || ['INBOX'],
        q: query.query
      });
      
      return { messages: result.messages };
    } catch (error) {
      console.error('Error getting messages:', error);
      // Return empty array on error
      return { messages: [] };
    }
  }
  
  async getMessage(accountId: string, messageId: string): Promise<{ message: EmailMessage | null }> {
    try {
      const message = await emailService.getEmail(messageId);
      return { message };
    } catch (error) {
      console.error(`Error getting message ${messageId}:`, error);
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
  
  async sendMessage(accountId: string, message: Partial<EmailMessage>): Promise<void> {
    console.log(`Sending message from account ${accountId}:`, message);
  }
  
  async saveDraft(accountId: string, draft: Partial<EmailMessage>): Promise<{ message: EmailMessage }> {
    console.log(`Saving draft in account ${accountId}:`, draft);
    
    // Return a mock message
    return {
      message: {
        id: `draft-${Date.now()}`,
        threadId: `thread-${Date.now()}`,
        subject: draft.subject || '(No Subject)',
        from: 'user@example.com',
        to: draft.to || '',
        date: new Date().toISOString(),
        body: draft.body || '',
        snippet: draft.snippet || '',
        labels: ['DRAFT'],
        attachments: false,
        isRead: true,
        isStarred: false,
        isImportant: false
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