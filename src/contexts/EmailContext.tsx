import React, { createContext, useContext, useEffect, useState } from 'react';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { getEnv } from '../config/env';
import { EmailAccount } from '../services/email/types';
import { toast } from 'sonner';

interface EmailContextType {
  accounts: EmailAccount[];
  loading: boolean;
  error: Error | null;
}

const EmailContext = createContext<EmailContextType>({
  accounts: [],
  loading: true,
  error: null
});

export const useEmail = () => useContext(EmailContext);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        if (!user?.email) {
          console.log('No user email available, skipping email account load');
          return;
        }

        console.log('Loading email accounts for user:', user.email);
        
        // Initialize the email service
        await emailServiceAdapter.initialize();
        
        // Get the accounts
        const accounts = await emailServiceAdapter.getAccounts();
        setAccounts(accounts);
      } catch (error) {
        console.error('Failed to load email accounts:', error);
        // Don't throw the error, just log it and continue
        // The user can retry later when the Google API client is ready
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, [user?.email]);

  return (
    <EmailContext.Provider value={{ accounts, loading, error }}>
      {children}
    </EmailContext.Provider>
  );
}; 