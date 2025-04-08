export type ThemeId = 'light' | 'dark' | 'cyberpunk' | 'tokyo-night' | 'synthwave' | 'matrix' | 'minimal';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    paper: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  effects?: {
    enableGlow?: boolean;
    enableScanlines?: boolean;
    enableGrid?: boolean;
    enableGlitch?: boolean;
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and minimal light theme',
    colors: {
      background: '#ffffff',
      paper: '#f8fafc',
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#94a3b8',
      border: '#e2e8f0',
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        muted: '#94a3b8',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme',
    colors: {
      background: '#0c1222',
      paper: '#1a2235',
      primary: '#ffffff',
      secondary: '#a8c0e3',
      accent: '#4287ff',
      border: '#3a4565',
      text: {
        primary: '#ffffff',
        secondary: '#c0d4f5',
        muted: '#8ca1c6',
      },
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High-tech, neon-infused cyberpunk aesthetic',
    colors: {
      background: '#000033',
      paper: '#000044',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      border: '#00ffff20',
      text: {
        primary: '#ffffff',
        secondary: '#00ffff',
        muted: '#00ffff80',
      },
    },
    effects: {
      enableGlow: true,
      enableScanlines: true,
      enableGrid: true,
      enableGlitch: true,
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Inspired by Tokyo\'s neon-lit nightscape',
    colors: {
      background: '#1a1b26',
      paper: '#24283b',
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#f7768e',
      border: '#414868',
      text: {
        primary: '#c0caf5',
        secondary: '#7aa2f7',
        muted: '#565f89',
      },
    },
    effects: {
      enableGlow: true,
      enableGrid: true,
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: '80s retro synthwave aesthetic',
    colors: {
      background: '#2b213a',
      paper: '#241b2f',
      primary: '#ff7edb',
      secondary: '#799bff',
      accent: '#f97e72',
      border: '#ff7edb20',
      text: {
        primary: '#ffffff',
        secondary: '#ff7edb',
        muted: '#ff7edb80',
      },
    },
    effects: {
      enableGlow: true,
      enableGrid: true,
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain matrix style',
    colors: {
      background: '#000000',
      paper: '#0a0a0a',
      primary: '#00ff00',
      secondary: '#00cc00',
      accent: '#008800',
      border: '#00ff0020',
      text: {
        primary: '#00ff00',
        secondary: '#00cc00',
        muted: '#00880080',
      },
    },
    effects: {
      enableScanlines: true,
      enableGlitch: true,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free interface',
    colors: {
      background: '#fafafa',
      paper: '#ffffff',
      primary: '#171717',
      secondary: '#525252',
      accent: '#737373',
      border: '#e5e5e5',
      text: {
        primary: '#171717',
        secondary: '#525252',
        muted: '#737373',
      },
    },
  },
]; 