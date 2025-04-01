import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { EmailService } from '../services/email/EmailService';
import { 
  EmailAccount, 
  EmailFolder, 
  EmailMessage, 
  EmailLabel, 
  EmailQuery, 
  IMAPConfig 
} from '../services/email/types';
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
  const [emailService] = useState(() => new EmailService());

  // Initialize with demo account data if needed
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        if (user) {
          console.log('Loading email accounts for user:', user.id);
          // This would normally come from your database
          const userAccounts = await emailService.getAccounts();
          
          console.log('Loaded accounts:', userAccounts);
          setAccounts(userAccounts);
          
          // Auto-select the first account if available
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
    
    // Set up a mock account for testing if needed
    const setupMockAccount = async () => {
      // Only add mock account if in development and user is logged in but has no accounts
      if (process.env.NODE_ENV === 'development' && user && accounts.length === 0) {
        try {
          console.log('Setting up mock email account for development...');
          // This simulates adding an account - in production this would connect to real email
          const mockAccount: EmailAccount = {
            id: 'mock-account-1',
            provider: 'imap',
            email: 'test@example.com',
            name: 'Test Account',
            connected: true,
            lastSynced: new Date()
          };
          
          // Add the mock account to state
          setAccounts([mockAccount]);
          setSelectedAccountId(mockAccount.id);
          
          console.log('Mock account created for development testing');
        } catch (error) {
          console.error('Failed to create mock account:', error);
        }
      }
    };
    
    // Uncomment this line to enable mock account for development
    // setupMockAccount();
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
      const newAccount = await emailService.addGoogleAccount();
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
      const newAccount = await emailService.addIMAPAccount(config);
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
      await emailService.removeAccount(accountId);
      
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
      return await emailService.getFolders(accountId);
    } catch (error) {
      console.error(`Failed to get folders for account ${accountId}:`, error);
      throw error;
    }
  };

  const getLabels = async (accountId: string) => {
    try {
      return await emailService.getLabels(accountId);
    } catch (error) {
      console.error(`Failed to get labels for account ${accountId}:`, error);
      throw error;
    }
  };

  const getMessages = async (accountId: string, query: EmailQuery) => {
    try {
      return await emailService.getMessages(accountId, query);
    } catch (error) {
      console.error(`Failed to get messages for account ${accountId}:`, error);
      throw error;
    }
  };

  const getMessage = async (accountId: string, messageId: string) => {
    try {
      return await emailService.getMessage(accountId, messageId);
    } catch (error) {
      console.error(`Failed to get message ${messageId} for account ${accountId}:`, error);
      throw error;
    }
  };

  const markAsRead = async (accountId: string, messageId: string) => {
    try {
      await emailService.markAsRead(accountId, messageId);
    } catch (error) {
      console.error(`Failed to mark message ${messageId} as read:`, error);
      throw error;
    }
  };

  const markAsUnread = async (accountId: string, messageId: string) => {
    try {
      await emailService.markAsUnread(accountId, messageId);
    } catch (error) {
      console.error(`Failed to mark message ${messageId} as unread:`, error);
      throw error;
    }
  };

  const moveToFolder = async (accountId: string, messageId: string, folderId: string) => {
    try {
      await emailService.moveToFolder(accountId, messageId, folderId);
    } catch (error) {
      console.error(`Failed to move message ${messageId} to folder ${folderId}:`, error);
      throw error;
    }
  };

  const applyLabel = async (accountId: string, messageId: string, labelId: string) => {
    try {
      await emailService.applyLabel(accountId, messageId, labelId);
    } catch (error) {
      console.error(`Failed to apply label ${labelId} to message ${messageId}:`, error);
      throw error;
    }
  };

  const removeLabel = async (accountId: string, messageId: string, labelId: string) => {
    try {
      await emailService.removeLabel(accountId, messageId, labelId);
    } catch (error) {
      console.error(`Failed to remove label ${labelId} from message ${messageId}:`, error);
      throw error;
    }
  };

  const deleteMessage = async (accountId: string, messageId: string) => {
    try {
      await emailService.deleteMessage(accountId, messageId);
    } catch (error) {
      console.error(`Failed to delete message ${messageId}:`, error);
      throw error;
    }
  };

  const sendMessage = async (accountId: string, message: Partial<EmailMessage>) => {
    try {
      await emailService.sendMessage(accountId, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const saveDraft = async (accountId: string, draft: Partial<EmailMessage>) => {
    try {
      return await emailService.saveDraft(accountId, draft);
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  };

  const refreshAccount = async (accountId: string) => {
    try {
      await emailService.refreshAccount(accountId);
    } catch (error) {
      console.error(`Failed to refresh account ${accountId}:`, error);
      throw error;
    }
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
        refreshAccount,
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