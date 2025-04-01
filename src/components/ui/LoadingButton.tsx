import React, { forwardRef } from 'react';
import { Button, ButtonProps } from './Button';
import { Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Text to display when loading (defaults to the children prop)
   */
  loadingText?: string;
  
  /**
   * Position of the loader ('left' or 'right')
   */
  loaderPosition?: 'left' | 'right';
  
  /**
   * Size of the loader
   */
  loaderSize?: number;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    className, 
    isLoading = false, 
    loadingText, 
    loaderPosition = 'left', 
    loaderSize = 16,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const content = loadingText && isLoading ? loadingText : children;
    
    return (
      <Button
        className={cn(
          isLoading && "relative",
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && loaderPosition === 'left' && (
          <Loader 
            className="animate-spin mr-2" 
            size={loaderSize} 
          />
        )}
        
        {content}
        
        {isLoading && loaderPosition === 'right' && (
          <Loader 
            className="animate-spin ml-2" 
            size={loaderSize} 
          />
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton }; 