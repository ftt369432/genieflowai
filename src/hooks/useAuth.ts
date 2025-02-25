import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../store';
import { useNotifications } from './useNotifications';

export function useAuth() {
  const { isAuthenticated, setAuthenticated } = useGlobalStore();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      // Implement your login logic here
      setAuthenticated(true);
      showSuccess('Successfully logged in');
      navigate('/');
    } catch (error) {
      showError('Failed to log in');
      throw error;
    }
  }, [setAuthenticated, showSuccess, showError, navigate]);

  const logout = useCallback(() => {
    setAuthenticated(false);
    showSuccess('Successfully logged out');
    navigate('/login');
  }, [setAuthenticated, showSuccess, navigate]);

  return {
    isAuthenticated,
    login,
    logout
  };
}