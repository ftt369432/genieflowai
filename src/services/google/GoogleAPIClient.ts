/**
 * GoogleAPIClient.ts
 * 
 * This class handles authentication and API calls to Google services.
 * Streamlined implementation to avoid discovery document issues.
 */

import { getEnv } from '../../config/env';
import { supabase } from '../supabase/supabaseClient';

// Types for Google API responses and parameters
export interface GoogleAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Google API Client for handling authentication and API requests
 */
export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private accessToken: string | null = null;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Direct API endpoints
  private static API_ENDPOINTS = {
    GMAIL_MESSAGES: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    GMAIL_MESSAGE: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/',
    CALENDAR_EVENTS: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo'
  };

  private constructor() {}

  static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  /**
   * Initialize the Google API client with a safe approach that doesn't use discovery docs
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        console.log('GoogleAPIClient: Initializing safely without discovery docs');
        
        // Get the session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          this.accessToken = session.provider_token;
          console.log('GoogleAPIClient: Initialized with provider token from session');
        }
        
        this.initialized = true;
      } catch (error) {
        console.error('GoogleAPIClient: Initialization error:', error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async refreshToken(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        this.accessToken = session.provider_token;
        console.log('GoogleAPIClient: Token refreshed from session');
      } else {
        throw new Error('No provider token available in session');
      }
    } catch (error) {
      console.error('GoogleAPIClient: Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Check if the user is signed in
   */
  isSignedIn(): boolean {
    try {
      const { useMock } = getEnv();
      
      // Set to false to allow real Gmail integration
      const forceMock = false;
      
      // In mock mode, always return true for development
      if (useMock || forceMock) {
        return true;
      }
      
      return this.initialized && !!this.accessToken;
    } catch (error) {
      console.error('GoogleAPIClient: Error checking sign in status:', error);
      return false;
    }
  }

  /**
   * Get the access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set the access token (used after OAuth flow)
   */
  setAccessToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
  }

  /**
   * Make a request to the Google API without using the gapi client
   */
  async request<T>({ path, method = 'GET', params = {}, body }: {
    path: string;
    method?: string;
    params?: Record<string, string>;
    body?: any;
  }): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.accessToken) {
      await this.refreshToken();
    }

    if (!this.accessToken) {
      throw new Error('No access token available. User needs to sign in first.');
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${path}${queryString ? '?' + queryString : ''}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          await this.refreshToken();
          // Retry the request once with the new token
          const retryResponse = await fetch(url, {
            method,
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
          });

          if (!retryResponse.ok) {
            throw new Error(`Request failed after token refresh: ${retryResponse.statusText}`);
          }

          return retryResponse.json();
        }
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('GoogleAPIClient: Error making request:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      console.log('GoogleAPIClient: Signing out');
      this.accessToken = null;
      this.initialized = false;
    } catch (error) {
      console.error('GoogleAPIClient: Error during sign out:', error);
      throw error;
    }
  }

  /**
   * Get mock response for development
   */
  private getMockResponse<T>(path: string): T {
    // For Gmail messages list
    if (path.includes('/gmail/v1/users/me/messages') && !path.includes('/messages/')) {
      return {
        messages: [
          { id: 'mock1', threadId: 'thread1' },
          { id: 'mock2', threadId: 'thread2' },
          { id: 'mock3', threadId: 'thread3' }
        ],
        nextPageToken: null,
        resultSizeEstimate: 3
      } as unknown as T;
    }
    
    // For a specific message request
    if (path.includes('/gmail/v1/users/me/messages/')) {
      const messageId = path.split('/').pop();
      return {
        id: messageId,
        threadId: 'thread1',
        labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
        snippet: 'This is a mock email snippet',
        internalDate: Date.now().toString(),
        payload: {
          mimeType: 'text/html',
          headers: [
            { name: 'Subject', value: 'Mock Email Subject' },
            { name: 'From', value: 'Mock Sender <mock@example.com>' },
            { name: 'To', value: 'You <you@example.com>' },
            { name: 'Date', value: new Date().toISOString() }
          ],
          body: {
            data: btoa('This is the content of the mock email.')
          }
        }
      } as unknown as T;
    }
    
    // For user profile info
    if (path.includes('userinfo')) {
      return {
        id: 'mock-user-id',
        email: 'mock-user@example.com',
        name: 'Mock User',
        given_name: 'Mock',
        family_name: 'User',
        picture: 'https://ui-avatars.com/api/?name=Mock+User&background=random'
      } as unknown as T;
    }
    
    // For calendar events
    if (path.includes('/calendar/v3/calendars/')) {
      return {
        items: [
          {
            id: 'event1',
            summary: 'Mock Event 1',
            start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
            end: { dateTime: new Date(Date.now() + 90000000).toISOString() }
          },
          {
            id: 'event2',
            summary: 'Mock Event 2',
            start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
            end: { dateTime: new Date(Date.now() + 176400000).toISOString() }
          }
        ]
      } as unknown as T;
    }
    
    // Generic mock response
    return { success: true } as unknown as T;
  }
}

// Export the singleton instance
export const googleApiClient = GoogleAPIClient.getInstance(); 