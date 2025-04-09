import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../store';
import { useNotifications } from './useNotifications';
import { supabase } from '../lib/supabase';
import googleAuthService from '../services/auth/googleAuth';
import { getEnv } from '../config/env';
import { useUserStore } from '../stores/userStore';
import { useSupabase } from '../providers/SupabaseProvider';

export function useAuth() {
  const { isAuthenticated, setAuthenticated } = useGlobalStore();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const { useMock } = getEnv();
  const clearUser = useUserStore(state => state.clearUser);
  const { clearSession } = useSupabase();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
    };
    checkAuth();
  }, [setAuthenticated]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      if (useMock) {
        console.log('Using mock authentication');
        setAuthenticated(true);
        showSuccess('Successfully logged in (mock mode)');
        navigate('/');
        return;
      }

      // Implement your login logic here
      setAuthenticated(true);
      showSuccess('Successfully logged in');
      navigate('/');
    } catch (error) {
      showError('Failed to log in');
      throw error;
    }
  }, [setAuthenticated, showSuccess, showError, navigate, useMock]);

  const logout = useCallback(async () => {
    try {
      console.log("Logout initiated");
      
      if (useMock) {
        console.log('Using mock logout');
        
        // Clear all user stores
        setAuthenticated(false);
        clearUser();
        clearSession();
        
        // Clear Supabase session
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('sb-bpczmzsozjlqxercmnyu-auth-token');
          sessionStorage.removeItem('supabase.auth.token');
        } catch (e) {
          console.error('Error clearing local storage:', e);
        }
        
        showSuccess('Successfully logged out (mock mode)');
        navigate('/login', { replace: true });
        return;
      }

      // First sign out from Google Auth Service
      try {
        await googleAuthService.signOut();
        console.log("Google Auth Service sign out completed");
      } catch (googleError) {
        console.error("Error signing out from Google Auth Service:", googleError);
        // Continue with Supabase logout even if Google logout fails
      }
      
      // Then sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase sign out error:", error);
          throw error;
        }
        console.log("Supabase sign out completed");
      } catch (supabaseError) {
        console.error("Error signing out from Supabase:", supabaseError);
        // Continue with local cleanup even if Supabase logout fails
      }
      
      // Always update local state regardless of service errors
      console.log("Updating local authentication state");
      setAuthenticated(false);
      clearUser();
      clearSession();
      
      // Clear any local storage tokens
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('sb-bpczmzsozjlqxercmnyu-auth-token');
        sessionStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.error('Error clearing local storage:', e);
      }
      
      showSuccess('Successfully logged out');
      
      // Always navigate to login page
      console.log("Navigating to login page");
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      showError('Failed to log out completely, but session terminated');
      
      // Force logout even on error
      setAuthenticated(false);
      clearUser();
      clearSession();
      navigate('/login', { replace: true });
    }
  }, [setAuthenticated, clearUser, clearSession, showSuccess, showError, navigate, useMock]);

  return {
    isAuthenticated,
    login,
    logout
  };
}