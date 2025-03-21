import React, { createContext, useContext, useEffect, useState } from 'react';
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
  mode: Theme;
  setMode: (mode: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'genieflow-theme';
const MODE_STORAGE_KEY = 'genieflow-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<Theme>(() => {
    return (localStorage.getItem(MODE_STORAGE_KEY) as Theme) || 'system';
  });

  // Default to dark theme if system preference is dark, light otherwise
  const getDefaultTheme = (): ThemeConfig => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeId = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme as ThemeId;
    return configThemes.find(t => t.id === themeId) || configThemes[0];
  };

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(getDefaultTheme());

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
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

  const handleModeChange = (newMode: Theme) => {
    setMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    applyMode(newMode);
  };

  const applyMode = (newMode: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newMode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newMode);
    }
  };

  useEffect(() => {
    // Handle system theme preference changes
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };

      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [mode]);

  useEffect(() => {
    // Apply initial theme
    applyTheme(theme);
    applyMode(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark,
      setTheme: handleThemeChange,
      toggleTheme,
      themes: configThemes,
      currentTheme,
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