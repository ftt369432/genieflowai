import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';

/**
 * Component to bypass the regular connection flow and go straight to email inbox
 * This is a workaround for the routing issue
 */
export function EmailBypass() {
  const navigate = useNavigate();

  useEffect(() => {
    // Force redirect to the email inbox page
    const redirectTimer = setTimeout(() => {
      // Use direct window location to force a full page refresh
      window.location.href = '/email/inbox';
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Spinner className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Redirecting to Email...</h2>
        <p className="text-muted-foreground">Please wait while we load your inbox.</p>
      </div>
    </div>
  );
}

export default EmailBypass; 