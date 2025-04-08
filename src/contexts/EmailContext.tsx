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

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { useMock } = getEnv();
        console.log('Loading email accounts for user:', useMock ? 'mock-user' : 'real-user');
        
        await emailServiceAdapter.initialize();
        const fetchedAccounts = await emailServiceAdapter.getAccounts();
        setAccounts(fetchedAccounts);
        setError(null);
      } catch (err) {
        console.error('Failed to load email accounts:', err);
        setError(err as Error);
        // In mock mode or development, set mock accounts even on error
        if (process.env.NODE_ENV === 'development' || getEnv().useMock) {
          setAccounts([{
            id: 'mock-account-1',
            email: 'mock@example.com',
            provider: 'gmail',
            name: 'Mock Account',
            connected: true,
            lastSynced: new Date()
          }]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  return (
    <EmailContext.Provider value={{ accounts, loading, error }}>
      {children}
    </EmailContext.Provider>
  );
}; 