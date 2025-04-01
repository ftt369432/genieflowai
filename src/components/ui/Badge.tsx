import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'default',
  children,
  className,
  ...props
}: BadgeProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors',
        // Size variants
        size === 'default' && 'px-2.5 py-0.5 text-xs',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm',
        // Color variants
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/80',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        variant === 'success' && 'bg-green-500 text-white',
        variant === 'outline' && 'border border-input bg-background text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 