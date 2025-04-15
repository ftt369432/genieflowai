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
import { GoogleAuthService } from '../../services/auth/googleAuth';

// Type conversion helper - converts from emailService.ts EmailMessage to types.ts EmailMessage
const convertEmailMessageType = (msg: ServiceEmailMessage): TypesEmailMessage => {
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: msg.subject,
    from: msg.from,
    to: Array.isArray(msg.to) ? msg.to.join(', ') : msg.to || '',
    date: msg.date,
    body: msg.body,
    snippet: msg.snippet,
    labels: msg.labels,
    read: msg.isRead,
    starred: msg.isStarred,
    attachments: Array.isArray(msg.attachments) ? msg.attachments : []
  };
};

// Reverse conversion - converts from types.ts EmailMessage to emailService.ts EmailMessage
const convertToServiceEmailMessage = (msg: Partial<TypesEmailMessage>): Partial<ServiceEmailMessage> => {
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: msg.subject,
    from: msg.from,
    to: msg.to,
    date: msg.date,
    body: msg.body,
    snippet: msg.snippet,
    labels: msg.labels,
    isRead: msg.read,
    isStarred: msg.starred,
    isImportant: msg.labels?.includes('IMPORTANT') || false,
    attachments: msg.attachments ? true : false
  };
};

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
        name: useUserStore.getState().user?.name || 'Gmail Account',
        connected: true,
        lastSynced: new Date()
      };
    }
    
    try {
      // Use googleAuthService for authentication
      const googleAuthService = GoogleAuthService.getInstance();
      await googleAuthService.signIn();
      
      // The above will redirect to Google's auth page, so we won't reach here
      // This is just a fallback
      return {
        id: `google-${Date.now()}`,
        provider: 'gmail',
        email: useUserStore.getState().user?.email || 'user@gmail.com',
        name: useUserStore.getState().user?.name || 'Gmail Account',
        connected: true,
        lastSynced: new Date()
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Redirecting to OAuth provider')) {
        // This is expected - the OAuth flow is redirecting
        throw error;
      }
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
      name: config.email, // Using email as name since name doesn't exist on IMAPConfig
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
        { id: 'work', name: 'Work', type: 'system', color: { backgroundColor: 'blue' } },
        { id: 'personal', name: 'Personal', type: 'system', color: { backgroundColor: 'green' } }
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