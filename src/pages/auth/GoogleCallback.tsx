import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailService } from '../../services/email';

export function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/settings?error=google-auth-failed');
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        navigate('/settings?error=no-auth-code');
        return;
      }

      try {
        await EmailService.addGoogleAccount(code);
        navigate('/settings?success=gmail-connected');
      } catch (error) {
        console.error('Failed to add Gmail account:', error);
        navigate('/settings?error=gmail-connection-failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting Gmail Account</h2>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we complete the setup...</p>
      </div>
    </div>
  );
} 