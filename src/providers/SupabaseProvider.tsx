import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getEnv } from '../config/env';
import { registerSupabaseUserSetter } from '../services/auth/authService';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';

// Supabase context type definition
interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  setMockUser: (userData: { id: string; email: string; fullName?: string }) => void;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get environment configuration
  const { supabaseUrl, supabaseAnonKey, useMock } = getEnv();
  
  // Create Supabase client using useMemo to prevent recreating on each render
  const supabase = useMemo(() => {
    console.log('Creating Supabase client with URL:', supabaseUrl);
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }, [supabaseUrl, supabaseAnonKey]);
  
  // Method to set a mock user in the Supabase context
  const setMockUser = (userData: { id: string; email: string; fullName?: string }) => {
    console.log('Setting mock user in Supabase context:', userData);
    
    // Create a compliant User object
    const mockUser: User = {
      id: userData.id,
      app_metadata: {},
      user_metadata: {
        full_name: userData.fullName || 'Mock User',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.email)}&background=random`,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: userData.email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    
    // Create a compliant Session object
    const mockSession: Session = {
      access_token: 'mock-token-' + Math.random().toString(36).substring(2, 9),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-' + Math.random().toString(36).substring(2, 9),
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    
    // Update state
    setUser(mockUser);
    setSession(mockSession);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update Google API client token when auth state changes
      if (session?.provider_token) {
        const googleClient = GoogleAPIClient.getInstance();
        googleClient.setAccessToken(session.provider_token);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading, setMockUser }}>
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