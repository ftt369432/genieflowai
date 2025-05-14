import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { registerSupabaseUserSetter } from '../services/auth/authService';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/userStore';

// Supabase context type definition
interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  setMockUser: (userData: { id: string; email: string; fullName?: string }) => void; // Reverted to synchronous
  clearSession: () => void;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Function to set mock user for development - SIMPLIFIED
  const setMockUser = (userData: { id: string; email: string; fullName?: string }): void => {
    console.log('SupabaseProvider: setMockUser (simplified) called with:', userData);
    const mockUserObject: User = {
      id: userData.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: userData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {
        provider: 'mock',
        providers: ['mock'],
      },
      user_metadata: {
        full_name: userData.fullName || 'Test User',
      },
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    };

    const mockSessionObject: Session = {
      access_token: 'mock-simplified-access-token', // No longer a complex JWT
      refresh_token: 'mock-simplified-refresh-token',
      user: mockUserObject,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
    };

    setUser(mockUserObject);
    setSession(mockSessionObject);
    setLoading(false); // Set loading to false as this is a direct state update
    console.log('SupabaseProvider: Internal user and session state updated with mock data (simplified).');
  };
  
  // Function to clear session data
  const clearSession = () => {
    console.log('Clearing Supabase session');
    setUser(null);
    setSession(null);
    
    // Clear local storage
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-bpczmzsozjlqxercmnyu-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.error('Error clearing local storage:', e);
    }
  };

  useEffect(() => {
    // Register the mock user setter
    registerSupabaseUserSetter(setMockUser);

    // Get initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('SupabaseProvider: Auth state change (from SupabaseProvider):', event, 'Session:', session);
      
      if (event === 'SIGNED_OUT') {
        clearSession();
      } else if (event === 'USER_UPDATED' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Check if the session and user are different before setting state to avoid infinite loops
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(session)) {
            return session;
          }
          return prevSession;
        });
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== JSON.stringify(session?.user ?? null)) {
            return session?.user ?? null;
          }
          return prevUser;
        });
        
        // Update Google API client token when auth state changes
        if (session?.provider_token) {
          const googleClient = GoogleAPIClient.getInstance();
          googleClient.setAccessToken(session.provider_token);
        }
      } else {
        console.log('SupabaseProvider: Unhandled auth event in onAuthStateChange:', event);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading, setMockUser, clearSession }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook to use Supabase context
export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};