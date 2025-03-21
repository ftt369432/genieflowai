import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { emailService } from '../services/email';
import type { 
  EmailAccount, 
  EmailFolder, 
  EmailFilter, 
  EmailPreferences, 
  EmailMessage 
} from '../services/email';

interface EmailContextType {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  selectedFolderId: string | null;
  
  // Account operations
  addGoogleAccount: () => Promise<EmailAccount>;
  addIMAPAccount: (config: any) => Promise<EmailAccount>;
  removeAccount: (accountId: string) => Promise<void>;
  selectAccount: (accountId: string) => void;
  
  // Folder operations
  getFolders: (accountId: string) => Promise<EmailFolder[]>;
  selectFolder: (folderId: string) => void;
  
  // Filter operations
  getFilters: (accountId: string) => Promise<EmailFilter[]>;
  saveFilter: (accountId: string, filter: EmailFilter) => Promise<EmailFilter>;
  deleteFilter: (accountId: string, filterId: string) => Promise<void>;
  
  // Message operations
  getMessages: (accountId: string, options?: any) => Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
  }>;
}

const EmailContext = createContext<EmailContextType | null>(null);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Load accounts from local storage on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const storedAccounts = localStorage.getItem('email_accounts');
        if (storedAccounts) {
          const loadedAccounts = JSON.parse(storedAccounts) as EmailAccount[];
          setAccounts(loadedAccounts);
          
          // If accounts exist, select the first one
          if (loadedAccounts.length > 0) {
            setSelectedAccountId(loadedAccounts[0].id);
            
            // Load folders for the first account
            const accountFolders = await emailService.getFolders(loadedAccounts[0].id);
            // Find inbox folder 
            const inboxFolder = accountFolders.find(f => f.type === 'inbox');
            if (inboxFolder) {
              setSelectedFolderId(inboxFolder.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load email accounts:', err);
      }
    };
    
    loadAccounts();
  }, []);
  
  // Account operations
  const addGoogleAccount = async (): Promise<EmailAccount> => {
    const account = await emailService.addGoogleAccount();
    setAccounts(prev => [...prev, account]);
    
    // Select the new account
    setSelectedAccountId(account.id);
    
    return account;
  };
  
  const addIMAPAccount = async (config: any): Promise<EmailAccount> => {
    const account = await emailService.addIMAPAccount(config);
    setAccounts(prev => [...prev, account]);
    
    // Select the new account
    setSelectedAccountId(account.id);
    
    return account;
  };
  
  const removeAccount = async (accountId: string): Promise<void> => {
    await emailService.removeAccount(accountId);
    setAccounts(prev => prev.filter(a => a.id !== accountId));
    
    // If the removed account was selected, select another one
    if (selectedAccountId === accountId) {
      const remainingAccount = accounts.find(a => a.id !== accountId);
      if (remainingAccount) {
        setSelectedAccountId(remainingAccount.id);
      } else {
        setSelectedAccountId(null);
        setSelectedFolderId(null);
      }
    }
  };
  
  const selectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
  };
  
  // Folder operations
  const getFolders = async (accountId: string): Promise<EmailFolder[]> => {
    return emailService.getFolders(accountId);
  };
  
  const selectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
  };
  
  // Message operations
  const getMessages = async (accountId: string, options?: any) => {
    return emailService.getMessages(accountId, options);
  };
  
  // Filter operations
  const getFilters = async (accountId: string): Promise<EmailFilter[]> => {
    return emailService.getFilters(accountId);
  };
  
  const saveFilter = async (accountId: string, filter: EmailFilter): Promise<EmailFilter> => {
    return emailService.saveFilter(accountId, filter);
  };
  
  const deleteFilter = async (accountId: string, filterId: string): Promise<void> => {
    return emailService.deleteFilter(accountId, filterId);
  };
  
  const contextValue: EmailContextType = {
    accounts,
    selectedAccountId,
    selectedFolderId,
    
    // Account operations
    addGoogleAccount,
    addIMAPAccount,
    removeAccount,
    selectAccount,
    
    // Folder operations
    getFolders,
    selectFolder,
    
    // Filter operations
    getFilters,
    saveFilter,
    deleteFilter,
    
    // Message operations
    getMessages,
  };
  
  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
} 