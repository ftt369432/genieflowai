/**
 * Google Authentication Service
 * 
 * Handles the OAuth2 flow with Google, including:
 * - Generating authorization URLs
 * - Handling auth callbacks
 * - Managing tokens
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from "../google/GoogleAPIClient";
import { supabase } from '@/lib/supabase';

// Define types for the auth response
interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

// Define types for the user setter function
type UserSetterFunction = (userData: { id: string; email: string; fullName?: string }) => void;

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private googleClient: GoogleAPIClient;
  private mockUserSetter: UserSetterFunction | null = null;
  private isInitialized = false;
  
  private constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
    console.log('GoogleAuthService: Initializing');
    this.initialize();
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize the Google API client
    await this.googleClient.initialize();
    
    this.isInitialized = true;
    console.log('GoogleAuthService: Initialization complete');
  }

  /**
   * Register a function to set mock users (used in development)
   */
  public registerMockUserSetter(setter: UserSetterFunction): void {
    this.mockUserSetter = setter;
    console.log('GoogleAuthService: Mock user setter registered');
  }

  /**
   * Get the correct callback URL based on environment
   */
  private getCallbackUrl(): string {
    const { authCallbackUrl } = getEnv();
    if (!authCallbackUrl) {
      throw new GoogleAuthError('Auth callback URL not configured');
    }
    return authCallbackUrl;
  }

  /**
   * Sign in with Google
   * In production, this uses Supabase OAuth
   * In development/mock mode, it creates a mock user
   */
  public async signIn(email?: string): Promise<GoogleAuthResponse> {
    const { useMock } = getEnv();
    
    // If in mock mode, use mock data
    if (useMock) {
      console.log('GoogleAuthService: Using mock sign in');
      if (!this.mockUserSetter) {
        throw new GoogleAuthError('Mock user setter not registered');
      }
      
      const mockUser = {
        id: 'mock-user-id',
        email: email || 'mock@example.com',
        name: 'Mock User',
        picture: 'https://example.com/mock-avatar.png'
      };
      
      this.mockUserSetter({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.name
      });
      
      return {
        user: mockUser,
        accessToken: 'mock-access-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
    }

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new GoogleAuthError(`Failed to get session: ${sessionError.message}`);
      }

      // If we already have a session with a provider token, use it
      if (session?.provider_token) {
        console.log('GoogleAuthService: Using existing provider token');
        return {
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name,
            picture: session.user.user_metadata?.avatar_url
          },
          accessToken: session.provider_token,
          expiresAt: session.expires_at! * 1000, // Convert to milliseconds
          refreshToken: session.refresh_token
        };
      }

      // Generate a random state parameter for OAuth security
      const state = crypto.randomUUID();
      localStorage.setItem('oauth_state', state);

      // If no session or no provider token, initiate OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.getCallbackUrl(),
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive https://mail.google.com/',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state
          }
        }
      });

      if (error) {
        throw new GoogleAuthError(`Failed to initiate OAuth: ${error.message}`);
      }

      // Store the OAuth URL in session storage for verification
      if (data?.url) {
        sessionStorage.setItem('oauth_url', data.url);
      }

      // The OAuth flow will redirect to the callback URL
      // The callback handler will set the provider token
      throw new GoogleAuthError('Redirecting to OAuth provider');
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  }

  /**
   * Handle the OAuth callback
   */
  public async handleCallback(): Promise<void> {
    const { useMock } = getEnv();
    if (useMock) return;

    try {
      // Verify state parameter
      const storedState = localStorage.getItem('oauth_state');
      const urlParams = new URLSearchParams(window.location.search);
      const returnedState = urlParams.get('state');

      if (storedState !== returnedState) {
        throw new GoogleAuthError('Invalid OAuth state parameter');
      }

      // Clear the state parameter
      localStorage.removeItem('oauth_state');

      // Get the session after OAuth callback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new GoogleAuthError(`Failed to get session: ${sessionError.message}`);
      }

      if (!session?.provider_token) {
        throw new GoogleAuthError('No provider token in session after OAuth callback');
      }

      // Initialize Google API client with the new token
      await this.googleClient.initialize();
      
      console.log('OAuth callback handled successfully');
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Check if the user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  /**
   * Sign out the user
   */
  public async signOut(): Promise<void> {
    const { useMock } = getEnv();
    if (useMock) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new GoogleAuthError(`Failed to sign out: ${error.message}`);
      }
      
      // Clear any stored OAuth state
      localStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_url');
      
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }
}

// Export the singleton instance
const googleAuthService = GoogleAuthService.getInstance();
export default googleAuthService;