export type ThemeType = 'light' | 'dark' | 'tokyo-night' | 'cyberpunk' | 'cyborg';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  paper: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const themes: Record<ThemeType, ThemeColors> = {
  light: {
    primary: '#0284c7',
    secondary: '#475569',
    background: '#ffffff',
    paper: '#f8fafc',
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#64748b',
    },
    border: '#cbd5e1',
    accent: '#0ea5e9',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
  },
  dark: {
    primary: '#38bdf8',
    secondary: '#94a3b8',
    background: '#0f172a',
    paper: '#1e293b',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
    },
    border: '#334155',
    accent: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  'tokyo-night': {
    primary: '#7aa2f7',
    secondary: '#bb9af7',
    background: '#1a1b26',
    paper: '#24283b',
    text: {
      primary: '#c0caf5',
      secondary: '#a9b1d6',
      muted: '#565f89',
    },
    border: '#414868',
    accent: '#ff9e64',
    success: '#9ece6a',
    warning: '#e0af68',
    error: '#f7768e',
    info: '#2ac3de',
  },
  cyberpunk: {
    primary: '#00fff9',
    secondary: '#ff00ff',
    background: '#0c0c2c',
    paper: '#161640',
    text: {
      primary: '#ffffff',
      secondary: '#00fff9',
      muted: 'rgba(0, 255, 249, 0.7)',
    },
    border: 'rgba(0, 255, 249, 0.3)',
    accent: '#ff00ff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#0099ff',
  },
  cyborg: {
    primary: '#ff4d4d',
    secondary: '#cccccc',
    background: '#121212',
    paper: '#1e1e1e',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      muted: '#999999',
    },
    border: '#333333',
    accent: '#ff4d4d',
    success: '#00cc66',
    warning: '#ffcc00',
    error: '#ff3333',
    info: '#3399ff',
  },
}; 