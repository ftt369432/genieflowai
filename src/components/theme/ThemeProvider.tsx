import React, { createContext, useContext, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { CyberpunkBackground } from './CyberpunkBackground';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, style, setMode } = useThemeStore();

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
    // Apply theme style
    document.documentElement.classList.toggle('theme-cyberpunk', style === 'cyberpunk');
    document.documentElement.classList.toggle('theme-modern', style === 'modern');
    document.documentElement.classList.toggle('theme-minimal', style === 'minimal');
  }, [style]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {style === 'cyberpunk' && <CyberpunkBackground />}
      {children}
    </div>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};