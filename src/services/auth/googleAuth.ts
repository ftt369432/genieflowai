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

export class GoogleAuthError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private googleApiClient: GoogleAPIClient;
  private mockUserSetter: UserSetterFunction | null = null;
  private isInitialized = false;
  
  private constructor() {
    this.googleApiClient = GoogleAPIClient.getInstance();
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
    await this.googleApiClient.initialize();
    
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
    const { serverUrl } = getEnv();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Use local URL when running locally
      return `${window.location.origin}/auth/callback`;
    } else {
      // Use Netlify URL in production
      return 'https://genieflowai.netlify.app/auth/callback';
    }
  }

  /**
   * Sign in with Google
   * In production, this uses Supabase OAuth
   * In development/mock mode, it creates a mock user
   */
  public async signIn(email?: string): Promise<GoogleAuthResponse> {
    const { useMock } = getEnv();
    
    if (useMock && this.mockUserSetter) {
      const mockEmail = email || 'mock.user@example.com';
      const mockId = 'mock-' + Math.random().toString(36).substring(2, 9);
      
      // Set mock user
      this.mockUserSetter({
        id: mockId,
        email: mockEmail,
        fullName: 'Mock User'
      });
      
      // Return mock auth response
      return {
        user: {
          id: mockId,
          email: mockEmail,
          name: 'Mock User',
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(mockEmail)}&background=random`
        },
        accessToken: 'mock-token-' + Math.random().toString(36).substring(2, 9),
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
    }
    
    // In production, use Supabase OAuth
    try {
      const callbackUrl = this.getCallbackUrl();
      console.log('Using callback URL:', callbackUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
          ].join(' ')
        }
      });
      
      if (error) {
        console.error('Google Auth Error:', error);
        throw new GoogleAuthError(error.message, error.status?.toString());
      }
      
      if (!data.url) {
        throw new GoogleAuthError('No OAuth URL returned from Supabase');
      }
      
      // This won't actually be reached as the user will be redirected
      // The actual user data will be handled in the auth callback
      return {
        user: { id: '', email: '' },
        accessToken: '',
        expiresAt: 0
      };
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      if (error instanceof GoogleAuthError) {
        throw error;
      }
      throw new GoogleAuthError('Failed to initiate Google sign-in');
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw new GoogleAuthError(error.message, error.status?.toString());
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      if (error instanceof GoogleAuthError) {
        throw error;
      }
      throw new GoogleAuthError('Failed to sign out');
    }
  }
}

// Export the singleton instance
const googleAuthService = GoogleAuthService.getInstance();
export default googleAuthService;