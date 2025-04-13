import { useCallback } from 'react';
import { useGlobalStore } from '../store';

// Rename to avoid conflict with ThemeContext
export function useGlobalTheme() {
  const { theme, setTheme } = useGlobalStore();

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };
} 