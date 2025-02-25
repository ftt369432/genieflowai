import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType, ThemeColors, themes } from '../config/themes';

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeType) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
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

    // Force dark theme classes
    document.documentElement.classList.remove('light', 'tokyo-night', 'cyberpunk', 'cyborg');
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light', 'tokyo-night', 'cyberpunk', 'cyborg');
    document.body.classList.add('dark');
    
    // Set background and text colors directly
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text.primary;
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], setTheme }}>
      <div className="dark min-h-screen bg-background text-text-primary transition-colors duration-200">
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