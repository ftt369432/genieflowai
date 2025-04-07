import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme as ThemeConfig, ThemeId, themes as configThemes } from '../config/themes';

// Define theme types
export type Theme = ThemeId | 'system';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themes: ThemeConfig[];
  currentTheme: ThemeConfig;
}

// Create a context with a default undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use React's useState hook inside the component
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  
  // Default to dark theme if system preference is dark, light otherwise
  const getDefaultTheme = (): ThemeConfig => {
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeId = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme as ThemeId;
      return configThemes.find(t => t.id === themeId) || configThemes[0];
    }
    return configThemes[0]; // Default to first theme if window is not available
  };

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(configThemes[0]);

  useEffect(() => {
    // Initialize with correct theme
    setCurrentTheme(getDefaultTheme());
    
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
      setCurrentTheme(configThemes.find(t => t.id === systemTheme) || configThemes[0]);
    } else {
      root.classList.add(newTheme);
      setIsDark(newTheme === 'dark');
      setCurrentTheme(configThemes.find(t => t.id === newTheme) || configThemes[0]);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    handleThemeChange(newTheme as Theme);
  };

  useEffect(() => {
    // Handle system theme preference changes
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        document.documentElement.classList.toggle('dark', e.matches);
        setIsDark(e.matches);
      };

      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark,
      setTheme: handleThemeChange,
      toggleTheme,
      themes: configThemes,
      currentTheme
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