import React from 'react';
import { useUserStore } from '../../stores/userStore';
import { Search, Bell, Settings, Menu, ChevronDown } from 'lucide-react';
import { getAvatar } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ className, onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const { user } = useUserStore();
  const navigate = useNavigate();
  
  return (
    <header className={cn(
      "h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center pl-4 pr-6",
      "sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center">
          {/* Mobile menu button - visible on mobile */}
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 md:mr-4 md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          {/* Desktop menu button - hidden on mobile */}
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4 hidden md:flex"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="py-2 pl-10 pr-4 w-40 md:w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell size={20} />
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          </button>
          
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings size={20} />
          </button>
          
          <div className="flex items-center ml-1 md:ml-2">
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={user?.avatar || getAvatar(user?.fullName || '')} 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-200 hidden sm:inline-block">
                {user?.fullName || 'User'}
              </span>
              <ChevronDown className="ml-1 md:ml-2 h-4 w-4 text-gray-500 hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}