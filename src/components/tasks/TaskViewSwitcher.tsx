import React from 'react';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

export type TaskViewType = 'board' | 'list' | 'grid';

interface TaskViewSwitcherProps {
  activeView: TaskViewType;
  onViewChange: (view: TaskViewType) => void;
}

export function TaskViewSwitcher({ activeView, onViewChange }: TaskViewSwitcherProps) {
  // Labels for the different view types
  const viewLabels: Record<TaskViewType, string> = {
    board: 'Board',
    list: 'List',
    grid: 'Spreadsheet'
  };

  // Icons for the different view types (simplified for now)
  const getViewIcon = (view: TaskViewType) => {
    switch (view) {
      case 'board':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="9"></rect>
            <rect x="14" y="7" width="3" height="5"></rect>
          </svg>
        );
      case 'list':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        );
      case 'grid':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {getViewIcon(activeView)}
          <span>{viewLabels[activeView]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(viewLabels) as TaskViewType[]).map((view) => (
          <DropdownMenuItem
            key={view}
            onClick={() => onViewChange(view)}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {activeView === view && <Check className="h-3 w-3" />}
            </div>
            <div className="flex items-center gap-2">
              {getViewIcon(view)}
              <span>{viewLabels[view]}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 