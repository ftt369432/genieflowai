import React, { useState } from 'react';
import { Search, Bell, Settings, User, Mic, MicOff, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import { MicrophoneControlMinimal } from '../ui/MicrophoneControl';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Card } from '../ui/Card';

interface HeaderProps {
  showSearch?: boolean;
  className?: string;
}

export function Header({ showSearch = true, className }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className={cn("h-16 px-4 flex items-center justify-between gap-4", className)}>
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

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
          <Bell className="h-5 w-5" />
        </Button>

        <MicrophoneControlMinimal />
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-text-secondary hover:text-text-primary",
              showSettings && "bg-primary/10 text-primary"
            )}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {showSettings && (
            <Card className="absolute right-0 top-12 w-80 z-50 p-4 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h3 className="font-medium">Settings</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSettings(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Theme</h4>
                    <ThemeSwitcher />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Preferences</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <span className="flex-1 text-left">Keyboard Shortcuts</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <span className="flex-1 text-left">Notifications</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <span className="flex-1 text-left">Privacy</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Account</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <span className="flex-1 text-left">Profile Settings</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-error hover:text-error">
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
      </div>
    </header>
  );
}