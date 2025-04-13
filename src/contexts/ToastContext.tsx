import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  id?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

// Define our own Toast type since it's not exported from sonner
interface Toast {
  id: string | number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => string | number;
  dismissToast: (toastId: string | number) => void;
  updateToast: (toastId: string | number, message: string, type?: ToastType) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => '',
  dismissToast: () => {},
  updateToast: () => {},
  toasts: [],
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    let toastId: string | number = '';
    
    switch (type) {
      case 'success':
        toastId = toast.success(message, options);
        break;
      case 'error':
        toastId = toast.error(message, options);
        break;
      case 'warning':
        toastId = toast.warning(message, options);
        break;
      case 'info':
      default:
        toastId = toast.info(message, options);
    }
    
    // We can't actually access the toast objects, but we track the IDs
    // This is just a placeholder for potential future functionality
    return toastId;
  }, []);

  const dismissToast = useCallback((toastId: string | number) => {
    toast.dismiss(toastId);
  }, []);

  const updateToast = useCallback((toastId: string | number, message: string, type: ToastType = 'info') => {
    // Using toast.custom to update existing toast
    // This is a simplified implementation
    toast.custom(
      (t) => <div>{message}</div>,
      { id: toastId as string }
    );
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, updateToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
} 