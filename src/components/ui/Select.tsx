import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
}

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2',
        'text-sm text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        'dark:border-gray-700 dark:bg-gray-800 dark:text-white',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
} 