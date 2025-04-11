import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import googleAuthService from '../services/auth/googleAuth';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import { getEnv } from '../config/env';
import { supabase } from '../lib/supabase';

// Get instance of Google API Client
const googleClient = GoogleAPIClient.getInstance();

/**
 * A dedicated test component for connecting Gmail accounts via Google OAuth
 * and verifying the provider token is successfully obtained
 */
export function GmailConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [gmailLabels, setGmailLabels] = useState<any[]>([]);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<string>('');

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is signed in with googleAuthService
        const isSignedIn = await googleAuthService.isSignedIn();
        console.log('Is user signed in:', isSignedIn);
        setIsAuthenticated(isSignedIn);
        
        if (isSignedIn) {
          // Try to initialize the Google client
          await googleClient.initialize();
          
          // Get and display session details for debugging
          const { data: { session } } = await supabase.auth.getSession();
          setSessionDetails(JSON.stringify(session, null, 2));
          
          if (session?.provider_token) {
            setProviderToken(session.provider_token);
            
            // Fetch user info if authenticated
            await fetchUserInfo();
          } else {
            console.log('No provider token found in session');
            
            // Force re-authentication with Google to get provider token
            if (!getEnv().useMock) {
              setError('Provider token missing. Please log out and log in again using Google authentication to grant Gmail access.');
            }
          }
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        setError(err.message || 'Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Sign out first to ensure clean authentication
      await supabase.auth.signOut();
      
      // Sign in with Google using enhanced scopes
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly'
        }
      });
      
      // The page will be redirected so we don't need to handle the result here
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabase.auth.signOut();
      
      // Clear state
      setIsAuthenticated(false);
      setProviderToken(null);
      setUserInfo(null);
      setSessionDetails('');
      setGmailLabels([]);
      
      // Reload page to ensure clean state
      window.location.reload();
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await googleClient.request<any>('/oauth2/v2/userinfo', {
        method: 'GET'
      });
      
      setUserInfo(response);
      console.log('User info:', response);
    } catch (err: any) {
      console.error('Error fetching user info:', err);
      setError(err.message || 'Failed to fetch user information');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGmailLabels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await googleClient.request<any>('/gmail/v1/users/me/labels', {
        method: 'GET'
      });
      
      setGmailLabels(response.labels || []);
      console.log('Gmail labels:', response);
    } catch (err: any) {
      console.error('Error fetching Gmail labels:', err);
      setError(err.message || 'Failed to fetch Gmail labels');
    } finally {
      setIsLoading(false);
    }
  };

  const env = getEnv();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Gmail Connection Test</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
        <p className="mb-2"><strong>Environment:</strong> {env.isProduction ? 'Production' : 'Development'}</p>
        <p className="mb-2"><strong>Mock Mode:</strong> {env.useMock ? 'Enabled' : 'Disabled'}</p>
        <p className="mb-2"><strong>Auth Callback URL:</strong> {env.authCallbackUrl}</p>
      </Card>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        {isLoading && (
          <div className="flex justify-center my-4">
            <Loader className="animate-spin" size={24} />
          </div>
        )}
        
        {!isAuthenticated ? (
          <div>
            <p className="mb-4">You are not currently authenticated with Google.</p>
            <Button onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : null}
              Sign in with Google
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-green-600 mb-4">✓ You are authenticated with Google.</p>
            
            {providerToken ? (
              <p className="text-green-600 mb-4">✓ Provider token is available.</p>
            ) : (
              <p className="text-red-600 mb-4">✗ No provider token available.</p>
            )}
            
            {userInfo && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">User Information</h3>
                <p><strong>Name:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>ID:</strong> {userInfo.id}</p>
                {userInfo.picture && (
                  <img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="mt-2 w-16 h-16 rounded-full" 
                  />
                )}
              </div>
            )}
            
            <div className="mt-6 flex space-x-4">
              <Button onClick={fetchUserInfo} disabled={isLoading}>
                {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : null}
                Test User Info API
              </Button>
              
              <Button onClick={fetchGmailLabels} disabled={isLoading}>
                {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : null}
                Test Gmail API
              </Button>
              
              <Button onClick={handleSignOut} disabled={isLoading} variant="destructive">
                {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : null}
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {gmailLabels.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Gmail Labels</h2>
          <ul className="list-disc pl-5">
            {gmailLabels.map((label) => (
              <li key={label.id} className="mb-1">
                {label.name} <span className="text-gray-500">({label.id})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {sessionDetails && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Details (Debug)</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96">
            {sessionDetails}
          </pre>
        </Card>
      )}
    </div>
  );
} 