import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, LogOut, Settings, ChevronDown, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserStore } from '../../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { getAvatar } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { getEnv } from '../../config/env';
import { useSupabase } from '../../providers/SupabaseProvider';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { signOut } = useAuth();
  const { showSuccess } = useNotifications();
  const user = useUserStore(state => state.user);
  const navigate = useNavigate();
  const { useMock } = getEnv();
  const { user: supabaseUser } = useSupabase();

  // Handle missing user info gracefully - memoize this to prevent re-renders
  const safeUser = useMemo(() => ({
    fullName: user?.fullName || supabaseUser?.user_metadata?.full_name || 'User',
    email: user?.email || supabaseUser?.email || 'user@example.com',
    avatar: user?.avatar
  }), [user?.fullName, user?.email, user?.avatar, supabaseUser?.email, supabaseUser?.user_metadata?.full_name]);

  // Only log on initial render and when important values change
  useEffect(() => {
    console.log("UserMenu mounting with user:", user || supabaseUser);
    console.log("Mock mode:", useMock);
  }, [user, useMock, supabaseUser]);

  // Log menu state changes separately
  useEffect(() => {
    console.log("Menu state:", isOpen ? "open" : "closed");
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only run if menu is open
      if (!isOpen) return;
      
      // Check if click is outside both the menu and button
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Use capture phase to ensure our handler runs first
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]); // Add isOpen as dependency to re-add listener when menu opens/closes

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

  // Memoize event handlers to prevent recreation on each render
  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Logout button clicked");
    try {
      setIsOpen(false); // Close menu first
      await signOut();
      navigate('/login');
      showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [signOut, showSuccess, navigate]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Toggling menu from", isOpen, "to", !isOpen);
    // Force a state update with function form
    setIsOpen(currentState => !currentState);
  }, [isOpen]);

  const navigateTo = useCallback((path: string) => {
    return () => {
      navigate(path);
      setIsOpen(false);
    };
  }, [navigate]);

  // Always render the dropdown even if user data is not fully available yet
  return (
    <div className="relative z-[100]" ref={menuRef} style={{ pointerEvents: 'auto' }}>
      <button
        ref={buttonRef}
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
          "ml-2 h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div 
          className={cn(
            "fixed inset-0 z-[90]",
            "bg-transparent" // Invisible overlay to catch clicks
          )}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={cn(
              "absolute right-0 top-[40px] mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800",
              "ring-1 ring-black ring-opacity-5 focus:outline-none",
              "transform transition-all duration-200 ease-in-out",
              "z-[101]" // Ensure dropdown is above overlay
            )}
            onClick={(e) => e.stopPropagation()} // Prevent clicks from closing menu
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              {useMock && (
                <div className="px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Mock Mode Active
                </div>
              )}
              <button
                onClick={navigateTo('/profile')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <User className="mr-2 h-4 w-4" />
                Profile & Accounts
              </button>
              <button
                onClick={navigateTo('/settings')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
              <button
                onClick={navigateTo('/gmail-test')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700 mt-1 pt-1",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Mail className="mr-2 h-4 w-4" />
                Gmail Connection Test
              </button>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}