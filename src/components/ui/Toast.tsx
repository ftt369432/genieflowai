import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ToastProps {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'default',
  onClose,
}) => {
  return (
    <div
      className={`p-4 rounded-md mb-2 shadow-md ${
        variant === 'destructive'
          ? 'bg-red-50 border border-red-200 text-red-800'
          : 'bg-white border border-gray-200 text-gray-900'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <p className="text-sm">{description}</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-md"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const toasts: ToastProps[] = [];
let listeners: (() => void)[] = [];

export const toast = ({ title, description, variant }: ToastProps) => {
  toasts.push({ title, description, variant });
  
  // In a real implementation, this would trigger a UI update
  // For this demo, we'll just log to console
  console.log(`Toast: ${title || ''} - ${description}`);
  
  // Notify listeners
  listeners.forEach(listener => listener());
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    const index = toasts.findIndex(t => t.description === description && t.title === title);
    if (index !== -1) {
      toasts.splice(index, 1);
      listeners.forEach(listener => listener());
    }
  }, 3000);

  return {
    id: Date.now().toString(),
    dismiss: () => {
      const index = toasts.findIndex(t => t.description === description && t.title === title);
      if (index !== -1) {
        toasts.splice(index, 1);
        listeners.forEach(listener => listener());
      }
    }
  };
};

export const ToastContainer: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const [, setUpdate] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
    
    const handleUpdate = () => {
      setUpdate(n => n + 1);
    };
    
    listeners.push(handleUpdate);
    
    return () => {
      listeners = listeners.filter(l => l !== handleUpdate);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 max-w-md z-50 space-y-2">
      {toasts.map((toast, i) => (
        <Toast
          key={i}
          {...toast}
          onClose={() => {
            toasts.splice(i, 1);
            setUpdate(n => n + 1);
          }}
        />
      ))}
    </div>
  );
}; 