import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { googleApiClient } from '../../services/google/GoogleAPIClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The session will be automatically set by Supabase Auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Auth callback session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        if (!session) {
          console.error('No session found after OAuth callback');
          setError('Authentication failed. No session established.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Initialize Google API client now that we have a session
        await googleApiClient.initialize();
        
        // Redirect to home page or dashboard
        navigate('/');
      } catch (e) {
        console.error('Auth callback error:', e);
        setError('An unexpected error occurred during authentication.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
        <p>Redirecting you to the login page...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
} 