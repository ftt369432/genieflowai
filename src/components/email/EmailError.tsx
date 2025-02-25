import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { EmailError } from '../../services/email/types';

interface EmailErrorProps {
  error: EmailError;
  onRetry?: () => void;
}

export function EmailError({ error, onRetry }: EmailErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error loading emails
          </h3>
          <p className="mt-1 text-sm text-red-600">
            {error.message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}