import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import googleAuthService from '../../services/auth/googleAuth';
import { useNavigate } from 'react-router-dom';
import { getEnv } from '../../config/env';

export interface GoogleButtonProps {
  variant?: 'default' | 'outline';
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  className?: string;
  label?: string;
  redirectUrl?: string;
}

export function GoogleButton({
  variant = 'outline',
  onSuccess,
  onError,
  className = '',
  label = 'Sign in with Google',
  redirectUrl = '/auth/callback'
}: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { useMock } = getEnv();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Google Auth service
    const initAuth = async () => {
      try {
        await googleAuthService.initialize();
        // Clear any previous errors if initialization succeeds
        setInitError(null);
      } catch (error) {
        console.error('Failed to initialize Google Auth service:', error);
        setInitError('Google authentication service initialization failed');
      }
    };
    
    initAuth();
    
    // Cleanup function to clear any timeouts when component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    // Don't proceed if already loading
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Clear any previous errors
      setInitError(null);
      
      // Set a safety timeout to reset loading state after 10 seconds
      // This prevents the button from getting stuck in a loading state
      timeoutRef.current = window.setTimeout(() => {
        console.log('GoogleButton: Safety timeout reached, resetting loading state');
        setIsLoading(false);
      }, 10000);
      
      // If in mock mode, manually handle the redirect
      if (useMock) {
        console.log('Mock mode: Simulating Google sign-in');
        
        // Simulate a short delay
        setTimeout(() => {
          // Navigate to the callback URL with a mock code
          navigate(redirectUrl + '?code=mock-auth-code');
          setIsLoading(false);
          
          // Clear the safety timeout since we're done
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }, 1000);
        return;
      }
      
      // Try to initialize if not already initialized
      if (initError) {
        try {
          await googleAuthService.initialize();
          setInitError(null);
        } catch (error) {
          console.error('Failed to initialize Google Auth service during sign-in:', error);
          throw new Error('Could not connect to Google authentication service');
        }
      }
      
      // Use the GoogleAuthService to sign in
      await googleAuthService.signIn();
      
      // The signIn method handles the redirect, but we add a fallback
      // in case something prevents the redirect from happening
      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, 10000);
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
      
      if (error instanceof Error) {
        setInitError(error.message);
        onError?.(error);
      } else {
        setInitError('Authentication failed');
        onError?.(new Error('Authentication failed'));
      }
      
      // Clear the safety timeout since we're done
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant={variant}
        className={`flex items-center justify-center ${className}`}
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting to Google...
          </span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {label}
          </>
        )}
      </Button>
      {initError && (
        <div className="text-red-500 text-sm mt-2">
          {initError}
        </div>
      )}
    </div>
  );
} 