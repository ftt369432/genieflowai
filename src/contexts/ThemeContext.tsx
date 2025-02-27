import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType, ThemeMode, ThemeStyle, ThemeColors, themes } from '../config/themes';

interface ThemeContextType {
  theme: ThemeType;
  mode: ThemeMode;
  style: ThemeStyle;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-preference';
const MODE_STORAGE_KEY = 'app-theme-mode';
const STYLE_STORAGE_KEY = 'app-theme-style';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeType) || 'dark';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored as ThemeMode) || 'system';
  });

  const [style, setStyleState] = useState<ThemeStyle>(() => {
    const stored = localStorage.getItem(STYLE_STORAGE_KEY);
    return (stored as ThemeStyle) || 'default';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    localStorage.setItem(STYLE_STORAGE_KEY, style);
    
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    const colors = themes[theme];
    
    // Set base colors
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-paper', colors.paper);
    
    // Set text colors
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-muted', colors.text.muted);
    
    // Set utility colors
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);

    // Handle system theme preference
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        setThemeState(e.matches ? 'dark' : 'light');
      };

      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }

    // Apply theme classes
    document.documentElement.classList.remove('light', 'dark', 'tokyo-night', 'cyberpunk', 'cyborg');
    document.documentElement.classList.add(theme);
    
    // Apply style classes
    document.documentElement.classList.remove('default', 'modern', 'minimal');
    document.documentElement.classList.add(`theme-${style}`);
    
  }, [theme, mode, style]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setStyle = (newStyle: ThemeStyle) => {
    setStyleState(newStyle);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        mode, 
        style, 
        colors: themes[theme], 
        setTheme, 
        setMode, 
        setStyle 
      }}
    >
      <div className={`${theme} theme-${style} min-h-screen bg-background text-text-primary transition-colors duration-200`}>
        {children}
      </div>
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