import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
  children: React.ReactNode;
}

export function Badge({ 
  variant = 'default', 
  className, 
  children,
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-primary-100 text-primary-800',
        variant === 'outline' && 'border border-primary-200 text-primary-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 