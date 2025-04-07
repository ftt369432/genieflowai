import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { 
  emailService, 
  EmailMessage, 
  EmailFolder, 
  EmailLabel, 
  EmailAccount, 
  EmailFilter, 
  EmailQuery,
  IMAPConfig
} from '../services/email';
import { toast } from 'sonner';

type EmailContextType = {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  selectAccount: (accountId: string) => void;
  addGoogleAccount: () => Promise<EmailAccount>;
  addIMAPAccount: (config: IMAPConfig) => Promise<EmailAccount>;
  removeAccount: (accountId: string) => Promise<void>;
  getFolders: (accountId: string) => Promise<{ folders: EmailFolder[] }>;
  getLabels: (accountId: string) => Promise<{ labels: EmailLabel[] }>;
  getMessages: (accountId: string, query: EmailQuery) => Promise<{ messages: EmailMessage[] }>;
  getMessage: (accountId: string, messageId: string) => Promise<{ message: EmailMessage }>;
  markAsRead: (accountId: string, messageId: string) => Promise<void>;
  markAsUnread: (accountId: string, messageId: string) => Promise<void>;
  moveToFolder: (accountId: string, messageId: string, folderId: string) => Promise<void>;
  applyLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  removeLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  deleteMessage: (accountId: string, messageId: string) => Promise<void>;
  sendMessage: (accountId: string, message: Partial<EmailMessage>) => Promise<void>;
  saveDraft: (accountId: string, draft: Partial<EmailMessage>) => Promise<{ message: EmailMessage }>;
  refreshAccount: (accountId: string) => Promise<void>;
};

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Initialize with demo account data if needed
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        if (user) {
          console.log('Loading email accounts for user:', user.id);
          
          // Initialize email service
          await emailService.initialize();
          
          // Mock accounts for now
          const userAccounts: EmailAccount[] = [
            {
              id: 'mock-account-1',
              provider: 'gmail',
              email: user.email || 'user@example.com',
              name: 'Gmail Account',
              connected: true,
              lastSynced: new Date()
            }
          ];
          
          console.log('Loaded accounts:', userAccounts);
          setAccounts(userAccounts);
          
          // Auto-select the first account if available and no account is selected
          if (userAccounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(userAccounts[0].id);
          }
        } else {
          // Clear accounts when user logs out
          setAccounts([]);
          setSelectedAccountId(null);
        }
      } catch (error) {
        console.error('Failed to load email accounts:', error);
        toast.error('Failed to load email accounts');
      }
    };

    loadAccounts();
  }, [user]);

  const selectAccount = (accountId: string) => {
    if (accounts.some(account => account.id === accountId)) {
      setSelectedAccountId(accountId);
    } else {
      console.error(`Account with ID ${accountId} not found`);
    }
  };

  const addGoogleAccount = async () => {
    try {
      // Create a mock account for now
      const newAccount: EmailAccount = {
        id: `google-${Date.now()}`,
        provider: 'gmail',
        email: user?.email || 'user@gmail.com',
        name: 'Gmail Account',
        connected: true,
        lastSynced: new Date()
      };
      
      setAccounts([...accounts, newAccount]);
      
      // Auto-select the new account
      setSelectedAccountId(newAccount.id);
      
      return newAccount;
    } catch (error) {
      console.error('Failed to add Google account:', error);
      throw error;
    }
  };

  const addIMAPAccount = async (config: IMAPConfig) => {
    try {
      // Create a mock account for now
      const newAccount: EmailAccount = {
        id: `imap-${Date.now()}`,
        provider: 'imap',
        email: config.email,
        name: config.email,
        connected: true,
        lastSynced: new Date()
      };
      
      setAccounts([...accounts, newAccount]);
      
      // Auto-select the new account
      setSelectedAccountId(newAccount.id);
      
      return newAccount;
    } catch (error) {
      console.error('Failed to add IMAP account:', error);
      throw error;
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      // Remove account from state
      const updatedAccounts = accounts.filter(account => account.id !== accountId);
      setAccounts(updatedAccounts);
      
      // Update selected account if the removed one was selected
      if (selectedAccountId === accountId) {
        setSelectedAccountId(updatedAccounts.length > 0 ? updatedAccounts[0].id : null);
      }
    } catch (error) {
      console.error(`Failed to remove account ${accountId}:`, error);
      throw error;
    }
  };

  const getFolders = async (accountId: string) => {
    try {
      // Return mock folders with proper types
      return {
        folders: [
          { 
            id: 'inbox', 
            name: 'Inbox', 
            type: 'system' as const,
            unreadCount: 10,
            totalCount: 25 
          },
          { 
            id: 'sent', 
            name: 'Sent', 
            type: 'system' as const,
            unreadCount: 0,
            totalCount: 15 
          },
          { 
            id: 'drafts', 
            name: 'Drafts', 
            type: 'system' as const,
            unreadCount: 0,
            totalCount: 3 
          },
          { 
            id: 'trash', 
            name: 'Trash', 
            type: 'system' as const,
            unreadCount: 0,
            totalCount: 8 
          },
          { 
            id: 'spam', 
            name: 'Spam', 
            type: 'system' as const,
            unreadCount: 5,
            totalCount: 12 
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to get folders for account ${accountId}:`, error);
      throw error;
    }
  };

  const getLabels = async (accountId: string) => {
    try {
      // Return mock labels with proper types
      return {
        labels: [
          { 
            id: 'important', 
            name: 'Important',
            type: 'system' as const,
            color: { backgroundColor: 'red' } 
          },
          { 
            id: 'work', 
            name: 'Work',
            type: 'user' as const,
            color: { backgroundColor: 'blue' } 
          },
          { 
            id: 'personal', 
            name: 'Personal',
            type: 'user' as const,
            color: { backgroundColor: 'green' } 
          }
        ]
      };
    } catch (error) {
      console.error(`Failed to get labels for account ${accountId}:`, error);
      throw error;
    }
  };

  // Use our emailService to get real emails
  const getMessages = async (accountId: string, query: EmailQuery) => {
    try {
      // Map the query to our service's expected format
      const result = await emailService.getEmails({
        maxResults: query.pageSize || 20,
        labelIds: query.folderId ? [query.folderId] : (query.labelId ? [query.labelId] : ['INBOX']),
        q: query.search
      });
      
      return { messages: result.messages };
    } catch (error) {
      console.error(`Failed to get messages for account ${accountId}:`, error);
      return { messages: [] }; // Return empty array on error
    }
  };

  const getMessage = async (accountId: string, messageId: string) => {
    try {
      const message = await emailService.getEmail(messageId);
      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }
      return { message };
    } catch (error) {
      console.error(`Failed to get message ${messageId} for account ${accountId}:`, error);
      throw error;
    }
  };

  // Rest of the methods remain as mock implementations for now

  const markAsRead = async (accountId: string, messageId: string) => {
    console.log(`Marking message ${messageId} as read`);
  };

  const markAsUnread = async (accountId: string, messageId: string) => {
    console.log(`Marking message ${messageId} as unread`);
  };

  const moveToFolder = async (accountId: string, messageId: string, folderId: string) => {
    console.log(`Moving message ${messageId} to folder ${folderId}`);
  };

  const applyLabel = async (accountId: string, messageId: string, labelId: string) => {
    console.log(`Applying label ${labelId} to message ${messageId}`);
  };

  const removeLabel = async (accountId: string, messageId: string, labelId: string) => {
    console.log(`Removing label ${labelId} from message ${messageId}`);
  };

  const deleteMessage = async (accountId: string, messageId: string) => {
    console.log(`Deleting message ${messageId}`);
  };

  const sendMessage = async (accountId: string, message: Partial<EmailMessage>) => {
    console.log(`Sending message from account ${accountId}:`, message);
  };

  const saveDraft = async (accountId: string, draft: Partial<EmailMessage>) => {
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
  };

  const refreshAccount = async (accountId: string) => {
    console.log(`Refreshing account ${accountId}`);
  };

  return (
    <EmailContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectAccount,
        addGoogleAccount,
        addIMAPAccount,
        removeAccount,
        getFolders,
        getLabels,
        getMessages,
        getMessage,
        markAsRead,
        markAsUnread,
        moveToFolder,
        applyLabel,
        removeLabel,
        deleteMessage,
        sendMessage,
        saveDraft,
        refreshAccount
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}; 