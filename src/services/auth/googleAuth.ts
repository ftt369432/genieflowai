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
        picture: 'https://via.placeholder.com/150'
      };
      
      this.mockUserSetter({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.name
      });
      
      return {
        user: mockUser,
        accessToken: 'mock-token',
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
          expiresAt: session.expires_at! * 1000 // Convert to milliseconds
        };
      }

      // If no session or no provider token, initiate OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.getCallbackUrl(),
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly'
        }
      });

      if (error) {
        throw new GoogleAuthError(`Failed to initiate OAuth: ${error.message}`);
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

  /**
   * Fetch calendars from Google Calendar API
   */
  public async fetchCalendars(): Promise<any[]> {
    const { useMock } = getEnv();
    
    if (useMock) {
      // Return mock calendar data
      return [
        {
          id: 'primary',
          summary: 'My Calendar',
          backgroundColor: '#4285F4',
          primary: true
        },
        {
          id: 'work-calendar',
          summary: 'Work Calendar',
          backgroundColor: '#0F9D58',
          primary: false
        }
      ];
    }
    
    try {
      // Use the GoogleAPIClient to make the request
      const response = await this.googleApiClient.request<{items?: any[]}>('/calendar/v3/users/me/calendarList', {
        method: 'GET'
      });
      
      return response?.items || [];
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  }

  /**
   * Fetch events from Google Calendar API
   */
  public async fetchEvents(calendarId: string, timeMin: string, timeMax: string): Promise<any[]> {
    const { useMock } = getEnv();
    
    if (useMock) {
      // Return mock events data
      return [
        {
          id: 'event1',
          summary: 'Team Meeting',
          description: 'Weekly team sync',
          start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
          end: { dateTime: new Date(Date.now() + 7200000).toISOString() },
          location: 'Conference Room A'
        },
        {
          id: 'event2',
          summary: 'Project Deadline',
          description: 'Submit final deliverables',
          start: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
          end: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }
        }
      ];
    }
    
    try {
      // Use the GoogleAPIClient to make the request
      const url = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
      const response = await this.googleApiClient.request<{items?: any[]}>(url, {
        method: 'GET'
      });
      
      return response?.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }
}

// Export the singleton instance
const googleAuthService = GoogleAuthService.getInstance();
export default googleAuthService;