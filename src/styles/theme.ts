export type Theme = 'light' | 'dark' | 'cyberpunk';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    primary: '#0ea5e9',
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#3b82f6'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#c0d4f5',
    background: '#0c1222',
    text: '#ffffff',
    accent: '#4287ff'
  },
  cyberpunk: {
    primary: '#00fff0',
    secondary: '#ff00ff',
    background: '#000033',
    text: '#ffffff',
    accent: '#f0f000'
  }
};

export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    success: {
      light: '#86efac',
      DEFAULT: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      light: '#fde047',
      DEFAULT: '#eab308',
      dark: '#a16207',
    },
    error: {
      light: '#fca5a5',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
}; 