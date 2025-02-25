// Central store exports
export { useAIStore } from './aiStore';
export { useLegalStore } from './legalStore';
export { useThemeStore } from './themeStore';
export { useUserStore } from './userStore';

import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface GlobalStore {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  isSidebarOpen: true,
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
}));