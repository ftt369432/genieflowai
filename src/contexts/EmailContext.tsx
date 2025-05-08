import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
// import { getEnv } from '../config/env'; // Assuming getEnv might not be needed directly here now
import { EmailAccount, EmailFolder, EmailLabel, EmailQuery } from '../services/email/types';
import { EmailMessage } from '../services/email/emailService'; // Assuming EmailMessage is from here
import { toast } from 'sonner';

interface EmailContextType {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  messages: EmailMessage[];
  folders: EmailFolder[];
  labels: EmailLabel[];
  loading: boolean;
  error: Error | null;
  selectAccount: (accountId: string) => void;
  getMessages: (accountId: string, query: EmailQuery) => Promise<void>;
  getFolders: (accountId: string) => Promise<void>;
  getLabels: (accountId: string) => Promise<void>;
  sendMessage: (accountId: string, message: Partial<EmailMessage>) => Promise<void>;
  markAsRead: (accountId: string, messageId: string) => Promise<void>;
  markAsUnread: (accountId: string, messageId: string) => Promise<void>;
  moveToFolder: (accountId: string, messageId: string, folderId: string) => Promise<void>;
  applyLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  removeLabel: (accountId: string, messageId: string, labelId: string) => Promise<void>;
  deleteMessage: (accountId: string, messageId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  // TODO: Add functions for addGoogleAccount, addIMAPAccount, saveDraft, refreshAccount if needed at context level
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any>(null); // Placeholder for user state

  useEffect(() => {
    setTimeout(() => setUser({ email: 'user@example.com' }), 500); // Mock user
  }, []);

  const fetchMessages = useCallback(async (accountId: string, query: EmailQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailServiceAdapter.getMessages(accountId, query);
      setMessages(result.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      toast.error('Failed to load messages.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFoldersAndLabels = useCallback(async (accountId: string) => {
    try {
      const foldersResult = await emailServiceAdapter.getFolders(accountId);
      setFolders(foldersResult.folders || []);
      const labelsResult = await emailServiceAdapter.getLabels(accountId);
      setLabels(labelsResult.labels || []);
    } catch (err) {
      console.error('Failed to fetch folders/labels:', err);
      toast.error('Failed to load folders or labels.');
      setFolders([]);
      setLabels([]);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      if (!user?.email) {
        setLoading(false); return;
      }
      setLoading(true);
      setError(null);
      try {
        await emailServiceAdapter.initialize();
        const fetchedAccounts = await emailServiceAdapter.getAccounts();
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
          const defaultAccountId = fetchedAccounts[0].id;
          setSelectedAccountId(defaultAccountId);
          await fetchFoldersAndLabels(defaultAccountId);
          await fetchMessages(defaultAccountId, { folderId: 'INBOX', pageSize: 20 });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load initial email data'));
        toast.error('Failed to load email accounts.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user?.email, fetchFoldersAndLabels, fetchMessages]);

  const selectAccount = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    setSelectedAccountId(accountId);
    setMessages([]);
    setFolders([]);
    setLabels([]);
    try {
      await fetchFoldersAndLabels(accountId);
      await fetchMessages(accountId, { folderId: 'INBOX', pageSize: 20 });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to switch account'));
      toast.error('Failed to switch email account.');
    } finally {
      setLoading(false);
    }
  }, [fetchFoldersAndLabels, fetchMessages]);
  
  const performAction = useCallback(async <T extends any[]>(
    actionExecutor: (...args: T) => Promise<any>,
    successMessage: string,
    errorMessage: string,
    ...args: T
  ): Promise<void> => {
    setError(null);
    let success = false;
    try {
      await actionExecutor(...args);
      toast.success(successMessage);
      success = true;
    } catch (err) {
      console.error(errorMessage, err);
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast.error(errorMessage);
      success = false;
    }
  }, [setError]);

  const sendMessage = useCallback(
    async (accountId: string, message: Partial<EmailMessage>) => {
      await performAction(
        emailServiceAdapter.sendMessage.bind(emailServiceAdapter),
        'Message sent successfully.',
        'Failed to send message.',
        accountId, message
      );
    },
    [performAction]
  );

  const markAsRead = useCallback(
    async (accountId: string, messageId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.markAsRead.bind(emailServiceAdapter),
        'Message marked as read.',
        'Failed to mark message as read.',
        accountId, messageId
      );
      setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, read: true} : msg));
    },
    [performAction, setError]
  );

  const markAsUnread = useCallback(
    async (accountId: string, messageId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.markAsUnread.bind(emailServiceAdapter),
        'Message marked as unread.',
        'Failed to mark message as unread.',
        accountId, messageId
      );
      setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, read: false} : msg));
    },
    [performAction, setError]
  );
  
  const moveToFolder = useCallback(
    async (accountId: string, messageId: string, folderId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.moveToFolder.bind(emailServiceAdapter),
        'Message moved.',
        'Failed to move message.',
        accountId, messageId, folderId
      );
      if (selectedAccountId) {
          await fetchMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 20 }); 
      }
    },
    [performAction, selectedAccountId, fetchMessages, setError]
  );

  const applyLabel = useCallback(
    async (accountId: string, messageId: string, labelId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.applyLabel.bind(emailServiceAdapter),
        'Label applied.',
        'Failed to apply label.',
        accountId, messageId, labelId
      );
       if (selectedAccountId) {
           await fetchMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 20 });
       }
    },
    [performAction, selectedAccountId, fetchMessages, setError]
  );

  const removeLabel = useCallback(
    async (accountId: string, messageId: string, labelId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.removeLabel.bind(emailServiceAdapter),
        'Label removed.',
        'Failed to remove label.',
        accountId, messageId, labelId
      );
       if (selectedAccountId) {
          await fetchMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 20 });
       }
    },
    [performAction, selectedAccountId, fetchMessages, setError]
  );

  const deleteMessage = useCallback(
    async (accountId: string, messageId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.deleteMessage.bind(emailServiceAdapter),
        'Message deleted.',
        'Failed to delete message.',
        accountId, messageId
      );
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    },
    [performAction, setError]
  );
  
  const removeAccount = useCallback(
    async (accountId: string) => {
      setError(null);
      await performAction(
        emailServiceAdapter.removeAccount.bind(emailServiceAdapter),
        'Account removed.',
        'Failed to remove account.',
        accountId
      );
      const remainingAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(remainingAccounts);
      if (selectedAccountId === accountId) {
        const newSelectedId = remainingAccounts.length > 0 ? remainingAccounts[0].id : null;
        setSelectedAccountId(newSelectedId);
        if (newSelectedId) {
          await fetchFoldersAndLabels(newSelectedId);
          await fetchMessages(newSelectedId, { folderId: 'INBOX', pageSize: 20 });
        } else {
          setMessages([]);
          setFolders([]);
          setLabels([]);
        }
      }
    },
    [performAction, accounts, selectedAccountId, fetchFoldersAndLabels, fetchMessages, setError] 
  );

  const contextValue: EmailContextType = {
    accounts,
    selectedAccountId,
    messages,
    folders,
    labels,
    loading,
    error,
    selectAccount,
    getMessages: fetchMessages,
    getFolders: fetchFoldersAndLabels, 
    getLabels: fetchFoldersAndLabels,  
    sendMessage,
    markAsRead,
    markAsUnread,
    moveToFolder,
    applyLabel,
    removeLabel,
    deleteMessage,
    removeAccount,
  };

  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
}; 