import React from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none",
  
  variants: {
    default: "bg-primary text-white hover:bg-primary/90 shadow hover:shadow-md",
    destructive: "bg-error text-white hover:bg-error/90 shadow-sm hover:shadow",
    outline: "border border-border bg-transparent hover:bg-primary/10 hover:text-primary text-text-primary",
    ghost: "bg-transparent hover:bg-primary/10 text-text-primary hover:text-primary"
  },
  
  sizes: {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8",
    icon: "h-10 w-10"
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        buttonVariants.base,
        buttonVariants.variants[variant],
        buttonVariants.sizes[size],
        isLoading && "cursor-wait",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}); 