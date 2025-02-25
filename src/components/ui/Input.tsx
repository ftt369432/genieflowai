import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2',
        'text-sm text-gray-900 placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        'dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
        className
      )}
      {...props}
    />
  );
} 