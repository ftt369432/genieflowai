import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getEnv } from '../config/env';
import { registerSupabaseUserSetter } from '../services/auth/authService';

// Supabase context type definition
interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  setMockUser: (userData: { id: string; email: string; fullName?: string }) => void;
}

// Create context with a default value and export it
export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get environment configuration
  const { supabaseUrl, supabaseAnonKey, useMock } = getEnv();
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
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
    // Register the mock user setter with the auth service
    registerSupabaseUserSetter(setMockUser);
    
    // Initial auth state fetching
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // In mock mode, we don't need to check Supabase auth
        if (useMock) {
          console.log('Supabase initialized in mock mode');
          setLoading(false);
          return;
        }
        
        // Get session from Supabase
        const { data } = await supabase.auth.getSession();
        const initialUser = data.session?.user || null;
        const initialSession = data.session;
        
        setUser(initialUser);
        setSession(initialSession);
        
        console.log('Supabase auth initialized:', initialUser ? 'User authenticated' : 'No user');
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing Supabase auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [supabase, useMock]);
  
  // Provide context value
  const value: SupabaseContextType = {
    supabase,
    user,
    session,
    loading,
    setMockUser
  };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook for using the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 