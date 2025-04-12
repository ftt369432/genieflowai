import React from 'react';
import { Button } from '../ui/Button';
import { Check, LayoutGrid, List, Table2 } from 'lucide-react';
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

  // Icons for the different view types
  const getViewIcon = (view: TaskViewType) => {
    switch (view) {
      case 'board':
        return <LayoutGrid className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      case 'grid':
        return <Table2 className="h-4 w-4" />;
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