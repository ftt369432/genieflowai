import React from 'react';
import { Monitor, Moon, Sun, Zap, Bot, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import type { ThemeType } from '../../config/themes';

interface ThemeOption {
  value: ThemeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  className?: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun className="h-5 w-5" />,
    description: 'Clean and bright for daytime use',
    className: 'hover:bg-slate-100'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon className="h-5 w-5" />,
    description: 'Easy on the eyes in low light',
    className: 'hover:bg-gray-800/20'
  },
  {
    value: 'tokyo-night',
    label: 'Tokyo Night',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Inspired by Tokyo\'s nightlife',
    className: 'hover:bg-[#7aa2f7]/20'
  },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    icon: <Zap className="h-5 w-5" />,
    description: 'High contrast neon aesthetics',
    className: 'hover:bg-[#00fff9]/20'
  },
  {
    value: 'cyborg',
    label: 'Cyborg',
    icon: <Bot className="h-5 w-5" />,
    description: 'Mechanical and industrial feel',
    className: 'hover:bg-[#ff4d4d]/20'
  }
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-4 bg-paper border border-border rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-text-primary mb-2">Theme Settings</h3>
      <div className="grid gap-2">
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            className={`w-full justify-start gap-3 p-4 transition-all duration-200 ${
              theme === option.value 
                ? 'bg-primary/10 border-2 border-primary/30'
                : `hover:bg-primary/5 border-2 border-transparent ${option.className}`
            }`}
            onClick={() => setTheme(option.value)}
          >
            <div className={`p-2 rounded-full ${
              theme === option.value 
                ? 'bg-primary text-white' 
                : 'bg-primary/10'
            }`}>
              {option.icon}
            </div>
            <div className="flex flex-col items-start">
              <span className={`font-medium ${
                theme === option.value ? 'text-primary' : 'text-text-primary'
              }`}>
                {option.label}
              </span>
              <span className="text-xs text-text-secondary">
                {option.description}
              </span>
            </div>
            {theme === option.value && (
              <div className="ml-auto">
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ThemeSwitcherMinimal() {
  const { theme, setTheme } = useTheme();
  
  const nextTheme = () => {
    const currentIndex = themeOptions.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  const currentTheme = themeOptions.find(t => t.value === theme);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={nextTheme}
      className="gap-2 hover:bg-primary/5 border border-transparent hover:border-primary/20"
    >
      <div className="p-1.5 rounded-full bg-primary/10">
        {currentTheme?.icon}
      </div>
      <span className="hidden md:inline text-text-primary font-medium">
        {currentTheme?.label}
      </span>
    </Button>
  );
} 