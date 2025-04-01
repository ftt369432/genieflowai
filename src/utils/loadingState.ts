import { useState, useCallback } from 'react';
import { useNotify } from './notification';
import { toast } from 'sonner';

/**
 * Type for the loading state by operation ID
 */
export type LoadingState = {
  [key: string]: boolean;
};

/**
 * Options for withLoading function
 */
export interface WithLoadingOptions {
  errorTitle?: string;
  successTitle?: string;
  successMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
}

// Fallback notification when context is not available
const fallbackNotify = {
  success: (title: string, message: string) => {
    toast.success(title, { description: message });
  },
  error: (title: string, message: string) => {
    toast.error(title, { description: message });
  },
  apiError: (error: any, defaultMessage: string) => {
    const errorMessage = error?.message || defaultMessage;
    toast.error('Error', { description: errorMessage });
  }
};

/**
 * Hook for managing loading states
 * @returns Loading state utilities
 */
export function useLoadingState() {
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  
  // Always call the hook, even if we might not use its result
  const notifyFromContext = useNotify();
  
  // Use the context-based notify if available, otherwise use fallback
  const safeNotify = (method: 'success' | 'error' | 'apiError', ...args: any[]) => {
    try {
      // @ts-ignore
      return notifyFromContext[method](...args);
    } catch (e) {
      console.warn('Notification context not available, using fallback');
      // @ts-ignore
      return fallbackNotify[method](...args);
    }
  };

  /**
   * Start loading for an operation
   * @param operationId The operation identifier
   */
  const startLoading = useCallback((operationId: string) => {
    setLoadingState((prev) => ({ ...prev, [operationId]: true }));
  }, []);

  /**
   * Stop loading for an operation
   * @param operationId The operation identifier
   */
  const stopLoading = useCallback((operationId: string) => {
    setLoadingState((prev) => ({ ...prev, [operationId]: false }));
  }, []);

  /**
   * Check if an operation is loading
   * @param operationId The operation identifier
   * @returns True if the operation is loading
   */
  const isLoading = useCallback(
    (operationId: string) => {
      return !!loadingState[operationId];
    },
    [loadingState]
  );

  /**
   * Check if any operation is loading
   * @returns True if any operation is loading
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingState).some((loading) => loading);
  }, [loadingState]);

  /**
   * Wrapper for async functions to handle loading state
   * @param operationId The operation identifier
   * @param asyncFn The async function to execute
   * @param options Options for success/error handling
   * @returns Promise with the result of the async function
   */
  const withLoading = useCallback(
    async <T>(
      operationId: string,
      asyncFn: () => Promise<T>,
      options?: WithLoadingOptions
    ): Promise<T> => {
      const {
        errorTitle = 'Error',
        successTitle = 'Success',
        successMessage = 'Operation completed successfully',
        showSuccessNotification = false,
        showErrorNotification = true,
      } = options || {};

      try {
        startLoading(operationId);
        const result = await asyncFn();
        
        if (showSuccessNotification) {
          safeNotify('success', successTitle, successMessage);
        }
        
        return result;
      } catch (error) {
        if (showErrorNotification) {
          safeNotify('apiError', error, `Error during operation: ${operationId}`);
        }
        throw error;
      } finally {
        stopLoading(operationId);
      }
    },
    [startLoading, stopLoading]
  );

  return {
    loadingState,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}

/**
 * Higher-order function for wrapping async API calls with loading state
 * @param asyncFn The async function to wrap
 * @param options Loading options
 * @returns The wrapped function with loading state management
 */
export function createLoadingHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  operationId: string,
  options?: WithLoadingOptions
) {
  return (loadingStateHook: ReturnType<typeof useLoadingState>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return loadingStateHook.withLoading(
        operationId,
        () => asyncFn(...args),
        options
      );
    };
  };
} 