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
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      // Get session information
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`);
        return;
      }
      
      if (session) {
        // Format session details to display (redacted for security)
        const sessionDetailsObj = {
          id: session.user?.id ? `${session.user.id.substring(0, 8)}...` : 'none',
          email: session.user?.email || 'none',
          auth_provider: session.user?.app_metadata?.provider || 'none',
          has_provider_token: !!session.provider_token,
          provider_token: session.provider_token ? `${session.provider_token.substring(0, 15)}...` : 'none',
          created_at: session.user?.created_at || 'none',
          last_sign_in: session.user?.last_sign_in_at || 'none'
        };
        
        setSessionDetails(JSON.stringify(sessionDetailsObj, null, 2));
        
        // Save provider token
        setProviderToken(session.provider_token || null);
        
        // If we have a provider token, initialize Google client
        if (session.provider_token) {
          await googleClient.initialize();
          
          // Try to load Gmail labels as a test
          try {
            // Get account user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${session.provider_token}`
              }
            });
            
            if (userInfoResponse.ok) {
              const userInfoData = await userInfoResponse.json();
              setUserInfo(userInfoData);
            }
            
            // Get Gmail labels
            const labelsResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
              headers: {
                'Authorization': `Bearer ${session.provider_token}`
              }
            });
            
            if (labelsResponse.ok) {
              const labelsData = await labelsResponse.json();
              setGmailLabels(labelsData.labels || []);
            }
          } catch (apiError) {
            console.error('Error accessing Gmail API:', apiError);
          }
        }
      }
    } catch (e) {
      setError(`Error checking session: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setProviderToken(null);
      setUserInfo(null);
      setGmailLabels([]);
      setSessionDetails('');
    } catch (e) {
      setError(`Error signing out: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract token for display
  const getTokenForDisplay = () => {
    if (!providerToken) return null;
    
    try {
      // Simple token analyzer to show information for debugging
      // For JWT tokens this would decode them, for OAuth tokens we just show basic info
      const firstDotIndex = providerToken.indexOf('.');
      
      // If it's a JWT token
      if (firstDotIndex > 0 && providerToken.indexOf('.', firstDotIndex + 1) > 0) {
        const parts = providerToken.split('.');
        if (parts.length === 3) {
          try {
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            return {
              type: 'JWT',
              header,
              payload,
              expiry: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
            };
          } catch (e) {
            // If we can't parse it as JWT, fall back to simple analysis
          }
        }
      }
      
      // OAuth2 token analysis
      return {
        type: 'OAuth2 Token',
        length: providerToken.length,
        prefix: providerToken.substring(0, 10) + '...',
        suffix: '...' + providerToken.substring(providerToken.length - 5),
      };
    } catch (e) {
      return {
        error: 'Could not analyze token',
        message: e instanceof Error ? e.message : String(e)
      };
    }
  };

  const generateTokenJSON = () => {
    if (!providerToken) return '{}';
    
    return JSON.stringify({
      access_token: providerToken,
      token_type: "Bearer",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      expiry_date: Date.now() + 3600000 // 1 hour from now
    }, null, 2);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Gmail Connection Test</h1>
      
      {isLoading && (
        <div className="flex items-center space-x-2 mb-4">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isAuthenticated ? 'You are authenticated' : 'Not authenticated'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${providerToken ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{providerToken ? 'Provider token is available' : 'No provider token available'}</span>
            </div>
            
            {userInfo && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">User Information</h3>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <div><strong>Email:</strong> {userInfo.email}</div>
                  <div><strong>Name:</strong> {userInfo.name}</div>
                  {userInfo.picture && (
                    <div className="mt-2">
                      <img 
                        src={userInfo.picture} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-4">
              {isAuthenticated ? (
                <Button onClick={handleSignOut} variant="destructive">
                  Sign Out
                </Button>
              ) : (
                <Button onClick={() => window.location.href = '/api/auth/google'}>
                  Sign In with Google
                </Button>
              )}
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Session Details</h2>
          {sessionDetails ? (
            <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm overflow-auto max-h-56">
              {sessionDetails}
            </pre>
          ) : (
            <p className="text-muted-foreground">No session details available</p>
          )}
          
          <div className="mt-4">
            <Button onClick={checkSession} size="sm" variant="outline">
              Refresh Session Info
            </Button>
          </div>
        </Card>
        
        {providerToken && (
          <Card className="p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Token Information</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowToken(!showToken)}>
                {showToken ? 'Hide Token' : 'Show Token'}
              </Button>
            </div>
            
            {showToken && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Token Analysis</h3>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm overflow-auto max-h-56">
                    {JSON.stringify(getTokenForDisplay(), null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Token JSON for Email Connection</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copy this JSON and paste it into the "Initialize Gmail Connection" form:
                  </p>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm overflow-auto max-h-56">
                    {generateTokenJSON()}
                  </pre>
                </div>
              </div>
            )}
            
            {gmailLabels.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Gmail Labels (Verification)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {gmailLabels.map((label: any) => (
                    <div key={label.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      {label.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
} 