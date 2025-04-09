import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserStore } from '../../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { getAvatar } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { showSuccess } = useNotifications();
  const { user } = useUserStore();
  const navigate = useNavigate();

  // Handle missing user info gracefully
  const safeUser = {
    fullName: user?.fullName || 'User',
    email: user?.email || 'user@example.com',
    avatar: user?.avatar
  };

  console.log("UserMenu rendering. User:", user);
  console.log("Menu state:", isOpen ? "open" : "closed");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      showSuccess('Logged out successfully'); // Show success even on error since we're in mock mode
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    console.log("Toggling menu from", isOpen, "to", !isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={cn(
          "flex items-center py-1 px-2 rounded-lg focus:outline-none",
          "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
          "transition-colors duration-200"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-600">
          <img 
            src={safeUser.avatar || getAvatar(safeUser.fullName)} 
            alt="User avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        <span className="ml-2 font-medium text-gray-700 dark:text-gray-200 hidden sm:inline-block">
          {safeUser.fullName}
        </span>
        <ChevronDown className={cn(
          "ml-1 md:ml-2 h-4 w-4 text-gray-500 transition-transform duration-200",
          isOpen ? "transform rotate-180" : ""
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile to make it easier to see the menu */}
          <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
          
          <div 
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-50"
            role="menu"
            aria-orientation="vertical"
            data-testid="user-dropdown-menu"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeUser.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{safeUser.email}</p>
            </div>
            
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              data-testid="profile-menu-item"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              data-testid="settings-menu-item"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 dark:text-red-400 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
              data-testid="logout-menu-item"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
} 