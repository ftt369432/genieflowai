import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../providers/SupabaseProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

type AuthMode = 'signin' | 'signup' | 'magic';

// Debug component for Supabase API issues
function SupabaseDebug() {
  const [apiKeyInfo, setApiKeyInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    if (showDebug) {
      try {
        // Get API key from environment
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        const url = import.meta.env.VITE_SUPABASE_URL || '';
        
        if (!anonKey) {
          setApiKeyInfo({ error: 'No API key found in environment variables' });
          return;
        }
        
        // Parse the JWT
        const parts = anonKey.split('.');
        if (parts.length !== 3) {
          setApiKeyInfo({ error: 'Invalid JWT format - should have 3 parts separated by periods' });
          return;
        }
        
        try {
          const payload = JSON.parse(atob(parts[1]));
          
          // Extract project ref from URL
          const urlProjectRef = url.split('//')[1]?.split('.')[0];
          
          setApiKeyInfo({
            valid: true,
            role: payload.role,
            projectRef: payload.ref,
            urlProjectRef,
            mismatch: payload.ref !== urlProjectRef,
            expiration: new Date(payload.exp * 1000).toLocaleString(),
            expired: Date.now() > payload.exp * 1000,
            issuer: payload.iss
          });
        } catch (e) {
          setApiKeyInfo({ error: 'Could not decode JWT payload', details: e });
        }
      } catch (e) {
        setApiKeyInfo({ error: 'Error analyzing API key', details: e });
      }
    }
  }, [showDebug]);
  
  if (!showDebug) {
    return (
      <div className="mt-4 text-center">
        <button 
          onClick={() => setShowDebug(true)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Debug Supabase Connection
        </button>
      </div>
    );
  }
  
  return (
    <div className="mt-4 p-4 border rounded bg-gray-50 text-xs text-left">
      <h3 className="font-semibold mb-2">Supabase API Key Debug</h3>
      
      {apiKeyInfo?.error ? (
        <div className="text-red-500">{apiKeyInfo.error}</div>
      ) : apiKeyInfo ? (
        <div>
          <div>Role: {apiKeyInfo.role}</div>
          <div>Project Ref: {apiKeyInfo.projectRef}</div>
          <div>URL Project Ref: {apiKeyInfo.urlProjectRef}</div>
          {apiKeyInfo.mismatch && (
            <div className="text-red-500 font-bold">
              Project reference mismatch! API key is for a different project than the URL.
            </div>
          )}
          <div>Expiration: {apiKeyInfo.expiration}</div>
          {apiKeyInfo.expired && (
            <div className="text-red-500 font-bold">API key has expired!</div>
          )}
          <div>Issuer: {apiKeyInfo.issuer}</div>
          
          <div className="mt-2 font-semibold">Steps to fix:</div>
          <ol className="list-decimal ml-4">
            <li>Go to Supabase Dashboard</li>
            <li>Select your project: {apiKeyInfo.urlProjectRef}</li>
            <li>Go to Project Settings → API</li>
            <li>Copy the "anon public" key</li>
            <li>Update your .env file with the new key</li>
            <li>Restart your application</li>
          </ol>
        </div>
      ) : (
        <div>Loading API key information...</div>
      )}
      
      <button 
        onClick={() => setShowDebug(false)}
        className="mt-2 text-primary"
      >
        Hide Debug Info
      </button>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithMagicLink } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMessage('Please check your email for a confirmation link.');
      } else if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMessage('Check your email for the magic link.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to help create a test user
  const createTestUser = async () => {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'password123';
      
      // Pre-populate the form
      setEmail(testEmail);
      setPassword(testPassword);
      setMode('signup');
      
      console.log('Test user credentials ready:', { email: testEmail, password: testPassword });
    } catch (error: any) {
      console.error('Error preparing test user:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            {mode === 'signup' ? 'Create an Account' : 
             mode === 'magic' ? 'Sign In with Magic Link' : 'Sign In'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            {mode !== 'magic' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required={mode === 'signin' || mode === 'signup'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          {message && (
            <div className="text-green-500 text-sm mt-2">{message}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? 'Loading...'
                : mode === 'signup'
                ? 'Sign Up'
                : mode === 'magic'
                ? 'Send Magic Link'
                : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="flex flex-col space-y-2 text-center mt-4">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-primary hover:underline"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
          
          <button
            onClick={() => setMode(mode === 'magic' ? 'signin' : 'magic')}
            className="text-primary hover:underline text-sm"
          >
            {mode === 'magic'
              ? "Use password instead"
              : "Sign in with magic link"}
          </button>
        </div>

        {/* Debug components */}
        {import.meta.env.DEV && (
          <>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={createTestUser}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
              >
                Prepare Test User
              </button>
            </div>
            <SupabaseDebug />
          </>
        )}
      </div>
    </div>
  );
} 