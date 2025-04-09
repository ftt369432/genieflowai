import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  setMockUser: (userData: { id: string; email: string; fullName?: string }) => void;
  clearSession: () => void;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Function to set mock user for development
  const setMockUser = (userData: { id: string; email: string; fullName?: string }) => {
    const mockUser = {
      id: userData.id,
      email: userData.email,
      user_metadata: {
        full_name: userData.fullName || 'Test User'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User;
    
    setUser(mockUser);
    setLoading(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize Google API client with the provider token if available
      if (session?.provider_token) {
        const googleClient = GoogleAPIClient.getInstance();
        googleClient.setAccessToken(session.provider_token);
      }
      
      setLoading(false);
      console.log('Supabase auth initialized:', session ? 'User authenticated' : 'No user');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_OUT') {
        clearSession();
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update Google API client token when auth state changes
        if (session?.provider_token) {
          const googleClient = GoogleAPIClient.getInstance();
          googleClient.setAccessToken(session.provider_token);
        }
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
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 