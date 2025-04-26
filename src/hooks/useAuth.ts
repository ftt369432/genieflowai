import { useState, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useSupabase } from '../providers/SupabaseProvider';
import auth, { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  AuthError,
  AUTH_ERROR_CODES 
} from '../services/auth';

/**
 * Authentication hook that provides a unified interface for all auth functions
 * Uses the consolidated auth service and connects it with user store
 */
export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access user store for state management
  const { 
    setUser, 
    clearUser, 
    isAuthenticated, 
    user, 
    setAuthToken,
    updateProfile,
    syncWithGoogleProfile 
  } = useUserStore();
  
  // Access Supabase provider
  const { setMockUser, clearSession } = useSupabase();

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await auth.login(credentials);
      
      if (response.error) {
        setError(response.error.message);
        setLoading(false);
        return false;
      }
      
      if (response.user) {
        // Get user profile data
        const userData = {
          id: response.user.id,
          email: response.user.email || credentials.email,
          fullName: response.user.user_metadata?.full_name || credentials.email.split('@')[0],
          avatar: response.user.user_metadata?.avatar_url
        };
        
        // Set authentication state
        setUser({
          ...userData,
          subscription: null // Will be loaded separately
        });
        
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [setUser, setError]);

  /**
   * Register a new user
   */
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await auth.register(data);
      
      if (response.error) {
        setError(response.error.message);
        setLoading(false);
        return false;
      }
      
      // Automatically log in after registration
      if (response.user) {
        // Success - user is registered, but may need to confirm email
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [setError]);

  /**
   * Logout current user
   */
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    
    try {
      await auth.logout();
      clearUser();
      clearSession();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, [clearUser, clearSession]);

  /**
   * Login with Google
   */
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Initiate Google sign in
      await auth.google.signIn();
      
      // Sync with Google profile (if successful)
      await syncWithGoogleProfile();
      
      setLoading(false);
      return true;
    } catch (err) {
      // Ignore errors related to redirection
      if (err instanceof Error && err.message.includes('Redirecting')) {
        // This is normal - we're being redirected to Google auth
        setLoading(false);
        return false;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [syncWithGoogleProfile]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    auth // Expose the entire auth service for advanced usage
  };
};

export default useAuth;