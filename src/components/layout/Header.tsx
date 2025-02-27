import React, { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import { MicrophoneControl } from '../ui/MicrophoneControl';
import { SettingsMenu } from './SettingsMenu';
import { useServices } from '../../hooks/useServices';

interface HeaderProps {
  showSearch?: boolean;
  className?: string;
}

export function Header({ showSearch = true, className }: HeaderProps) {
  const { voiceControl } = useServices();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className={cn("h-16 px-4 flex items-center justify-between gap-4 relative", className)}>
      {showSearch && (
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-full bg-background border-border/40"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
            <Bell className="h-5 w-5" />
          </Button>

          <MicrophoneControl
            onStart={voiceControl.startListening}
            onStop={voiceControl.stopListening}
            className="mx-2"
          />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSettingsOpen(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <SettingsMenu 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      </div>
    </header>
  );
}