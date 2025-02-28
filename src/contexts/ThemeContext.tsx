import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeId, themes } from '../config/themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: ThemeId) => void;
  themes: Theme[];
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'genieflow-theme';
const MODE_STORAGE_KEY = 'genieflow-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    return themes.find(theme => theme.id === savedThemeId) || themes[0];
  });

  const [mode, setMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem(MODE_STORAGE_KEY) as 'light' | 'dark' | 'system') || 'system';
  });

  const setTheme = (themeId: ThemeId) => {
    const newTheme = themes.find(theme => theme.id === themeId);
    if (newTheme) {
      setCurrentTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  };

  const handleModeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  };

  useEffect(() => {
    // Handle system theme preference
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };

      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  }, [mode]);

  useEffect(() => {
    // Apply theme classes to root element
    const root = document.documentElement;
    
    // Remove all existing theme classes
    themes.forEach(theme => {
      root.classList.remove(`theme-${theme.id}`);
    });
    
    // Add current theme class
    root.classList.add(`theme-${currentTheme.id}`);

    // Apply theme colors as CSS variables
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue);
        });
      } else {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setTheme, 
      themes,
      mode,
      setMode: handleModeChange
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 