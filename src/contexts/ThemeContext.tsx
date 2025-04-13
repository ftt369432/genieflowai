import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useThemeStore, ThemeMode, ThemeStyle, ThemeColor } from '../store/themeStore';

interface Theme {
  name: string;
  colors: Record<string, string>;
  effects?: Record<string, boolean>;
}

interface ThemeContextType {
  theme: string;
  isDark: boolean;
  currentTheme: Theme;
  themes: Record<string, Theme>;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  mode: ThemeMode;
  style: ThemeStyle;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  setColor: (color: ThemeColor) => void;
}

// Define some default themes
const defaultThemes: Record<string, Theme> = {
  light: {
    name: 'Light',
    colors: {
      primary: '#3f51b5',
      secondary: '#f50057',
      background: '#ffffff',
      text: '#333333',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#b39ddb',
      secondary: '#ff4081',
      background: '#121212',
      text: '#ffffff',
    },
  },
};

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  currentTheme: defaultThemes.light,
  themes: defaultThemes,
  setTheme: () => {},
  toggleTheme: () => {},
  mode: 'light',
  style: 'default',
  color: 'blue',
  setMode: () => {},
  setStyle: () => {},
  setColor: () => {},
});

// Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { mode, style, color, setMode, setStyle, setColor } = useThemeStore();
  const [themes, setThemes] = useState(defaultThemes);

  // Derive theme from mode
  // For compatibility with existing code that expects 'theme' to be either 'light' or 'dark'
  const theme = mode === 'system' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : mode;

  const isDark = theme === 'dark';
  const currentTheme = themes[theme] || themes.light;

  // Toggle between light and dark
  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Listen for system preference changes if in system mode
  useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Initial check
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        currentTheme,
        themes,
        setTheme: (newTheme) => {
          // Convert string theme ('light'/'dark') to ThemeMode
          setMode(newTheme as ThemeMode);
        },
        toggleTheme,
        mode,
        style,
        color,
        setMode,
        setStyle, 
        setColor
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
} 