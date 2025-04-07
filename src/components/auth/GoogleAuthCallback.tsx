import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import googleAuthService from '../../services/auth/googleAuth';

export function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Initializing Google Auth service...');
        await googleAuthService.initialize();
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const authError = urlParams.get('error');
        
        if (authError) {
          throw new Error(`Google authentication error: ${authError}`);
        }

        if (!code) {
          throw new Error('No authorization code found in URL');
        }
        
        setStatus('Processing authorization code...');
        await googleAuthService.handleAuthCode(code);
        setStatus('Authentication successful! Redirecting...');
        
        // Wait a moment before redirecting so user can see success message
        setTimeout(() => {
          // Redirect to dashboard after successful auth
          navigate('/dashboard', { replace: true });
        }, 1000);
      } catch (error) {
        console.error('Authentication failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown authentication error');
        setStatus('Authentication failed');
        
        // Wait a moment before redirecting
        setTimeout(() => {
          navigate('/login?error=auth_failed', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          {!error ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Google Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{status}</p>
            </>
          ) : (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 