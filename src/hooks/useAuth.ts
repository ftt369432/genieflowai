import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../store';
import { useNotifications } from './useNotifications';
import { supabase } from '../lib/supabase';
import { googleApiClient } from '../services/google/GoogleAPIClient';
import { getEnv } from '../config/env';
import { useUserStore } from '../stores/userStore';
import { useSupabase } from '../providers/SupabaseProvider';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export function useAuth() {
  const { isAuthenticated, setAuthenticated } = useGlobalStore();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const { useMock } = getEnv();
  const clearUser = useUserStore(state => state.clearUser);
  const { clearSession } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    // Get the current session
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting auth session:', error);
          return;
        }
        
        if (session?.user) {
          // Initialize Google API client
          await googleApiClient.initialize();
          
          // If Google auth is connected, get user info from Google
          if (googleApiClient.isSignedIn()) {
            try {
              const userInfo = await googleApiClient.getUserInfo();
              setUser({
                id: session.user.id,
                email: userInfo.email || session.user.email || '',
                name: userInfo.name,
                avatar: userInfo.picture
              });
            } catch (error) {
              console.error('Error getting Google user info:', error);
              // Fall back to Supabase user data
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name
              });
            }
          } else {
            // Use Supabase user data
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Initialize Google API client
          await googleApiClient.initialize();
          
          if (googleApiClient.isSignedIn()) {
            try {
              const userInfo = await googleApiClient.getUserInfo();
              setUser({
                id: session.user.id,
                email: userInfo.email || session.user.email || '',
                name: userInfo.name,
                avatar: userInfo.picture
              });
            } catch (error) {
              console.error('Error getting Google user info:', error);
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name
              });
            }
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google using Supabase Auth
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Sign out from Google services
      if (googleApiClient.isSignedIn()) {
        await googleApiClient.signOut();
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  };
}