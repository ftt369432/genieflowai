import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../../services/auth/googleAuth';

export function GoogleAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          throw new Error('No authorization code found');
        }

        await googleAuthService.initialize();
        await googleAuthService.handleAuthCode(code);

        // Redirect to settings or dashboard after successful auth
        navigate('/settings', { replace: true });
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/settings?error=auth_failed', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
} 