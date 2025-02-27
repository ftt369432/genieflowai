import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmailService } from '../services/email/EmailService';
import { EmailAgent } from '../services/agents/EmailAgent';
import type { EmailAccount, EmailMessage } from '../types/email';
import { v4 as uuidv4 } from 'uuid';

interface EmailContextType {
  accounts: EmailAccount[];
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => Promise<void>;
  processEmail: (email: EmailMessage) => Promise<any>;
  loading: boolean;
  error: string | null;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const emailService = new EmailService();
  const emailAgent = new EmailAgent({
    id: uuidv4(),
    name: 'Email Assistant',
    type: 'email',
    capabilities: [
      'email-processing',
      'email-drafting',
      'email-categorization',
      'calendar-management',
      'task-management'
    ],
    config: {
      modelName: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      basePrompt: 'You are an intelligent email assistant that helps process and manage emails.'
    }
  });

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // TODO: Load accounts from persistent storage
        const savedAccounts = localStorage.getItem('email_accounts');
        if (savedAccounts) {
          setAccounts(JSON.parse(savedAccounts));
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load email accounts:', error);
        setError('Failed to load email accounts');
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  useEffect(() => {
    // Save accounts to local storage when they change
    localStorage.setItem('email_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (account: EmailAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const removeAccount = async (accountId: string) => {
    try {
      await emailService.removeAccount(accountId);
      setAccounts(prev => prev.filter(account => account.id !== accountId));
    } catch (error) {
      console.error('Failed to remove account:', error);
      throw error;
    }
  };

  const processEmail = async (email: EmailMessage) => {
    try {
      const result = await emailAgent.executeAction('process-email', { email });
      return result;
    } catch (error) {
      console.error('Failed to process email:', error);
      throw error;
    }
  };

  return (
    <EmailContext.Provider
      value={{
        accounts,
        addAccount,
        removeAccount,
        processEmail,
        loading,
        error
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
} 