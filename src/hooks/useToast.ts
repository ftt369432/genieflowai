import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // For now, we'll just console.log the toast
    // In a real app, you'd integrate with a toast library
    console.log('Toast:', options);
  }, []);

  return { toast };
} 