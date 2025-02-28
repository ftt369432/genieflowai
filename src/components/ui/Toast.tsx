import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant = 'default', onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full',
          variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground'
        )}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {title && (
              <div className="text-sm font-semibold">
                {title}
              </div>
            )}
            {description && (
              <div className="mt-1 text-sm opacity-90">
                {description}
              </div>
            )}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

let toastId = 0;
const toasts: Map<number, { element: JSX.Element; timer: NodeJS.Timeout }> = new Map();
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const toast = ({
  title,
  description,
  variant = 'default',
  duration = 5000
}: ToastProps & { duration?: number }) => {
  const id = toastId++;
  
  const handleClose = () => {
    toasts.delete(id);
    notifyListeners();
  };

  const element = (
    <Toast
      key={id}
      title={title}
      description={description}
      variant={variant}
      onClose={handleClose}
    />
  );

  const timer = setTimeout(handleClose, duration);
  toasts.set(id, { element, timer });
  notifyListeners();
};

export const useToasts = () => {
  const [, setUpdate] = React.useState({});

  React.useEffect(() => {
    const listener = () => setUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return Array.from(toasts.values()).map(({ element }) => element);
};

export const ToastContainer = () => {
  const toastElements = useToasts();

  if (toastElements.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      {toastElements}
    </div>
  );
}; 