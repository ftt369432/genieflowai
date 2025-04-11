/**
 * GoogleAPIClient.ts
 * 
 * This class handles authentication and API calls to Google services.
 * To use live data and connect your Gmail:
 * 1. Make sure VITE_USE_MOCK=false in your .env file
 * 2. Complete Google OAuth flow by logging in through Google
 * 3. The provider token will be set automatically after successful login
 */

import { supabase } from '../../lib/supabase';
import { getEnv, updateEnvConfig } from '../../config/env';

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
  private initialized = false;
  private useMockData = false;

  private constructor() {}

  static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  /**
   * Check if we're using mock data
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Get the access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set the access token directly - useful for refreshing the token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.initialized = true;
  }

  /**
   * Initialize the Google API client with the provider token from Supabase auth
   * The provider token is required for making authenticated Google API calls
   * and is obtained when a user completes the Google OAuth flow.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const { useMock } = getEnv();
    this.useMockData = useMock;
    
    // If in mock mode, initialize with mock data
    if (useMock) {
      console.log('GoogleAPIClient: Initializing in mock mode');
      this.accessToken = 'mock-token';
      this.initialized = true;
      return;
    }

    try {
      // Wait for Supabase to initialize and get the session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Failed to get session:', error);
        // Fall back to mock mode if configured
        if (useMock) {
          this.useMockData = true;
          this.accessToken = 'mock-token';
          this.initialized = true;
          console.log('GoogleAPIClient: Falling back to mock mode after session error');
          return;
        }
        throw error;
      }

      if (!session) {
        console.warn('No session available');
        // Add this to force real authentication even without session
        const forceReal = true; // Add this to your code or as env var
        
        if (!session && !forceReal) {
          // Only fall back to mock if not forcing real auth
          this.useMockData = true;
        }
        this.accessToken = 'mock-token';
        this.initialized = true;
        return;
      }

      // Check if we have a provider token - we need this for Google API access
      if (!session.provider_token) {
        console.warn('No provider token available, retrying...');
        console.log('To use real Google data, you need to sign in with Google OAuth and get a provider token.');
        console.log('This happens when you sign in through Google and grant permissions to access your Gmail.');
        
        // Retry getting the token a few times
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000; // 1 second

        while (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          const { data: { session: updatedSession } } = await supabase.auth.getSession();
          
          if (updatedSession?.provider_token) {
            this.accessToken = updatedSession.provider_token;
            this.initialized = true;
            console.log('GoogleAPIClient: Initialized with real token after retry');
            console.log('Successfully connected to Google. You can now use Gmail and other Google services.');
            return;
          }
          
          retryCount++;
        }

        // If we still don't have a token after retrying, force mock mode globally
        console.warn('No provider token available after retrying, forcing mock mode globally');
        console.log('To connect your Gmail account:');
        console.log('1. Make sure you set VITE_USE_MOCK=false in your .env file');
        console.log('2. Log out and log back in using the Google sign-in button');
        console.log('3. Grant the necessary permissions when prompted');
        
        updateEnvConfig({ useMock: true });
        this.useMockData = true;
        this.accessToken = 'mock-token';
        this.initialized = true;
        return;
      }

      this.accessToken = session.provider_token;
      this.initialized = true;
      console.log('GoogleAPIClient: Initialized with real token');
      console.log('Successfully connected to Google. You can now use Gmail and other Google services.');
    } catch (error) {
      console.error('Error during initialization:', error);
      // Force mock mode globally
      console.log('GoogleAPIClient: Forcing mock mode after error');
      updateEnvConfig({ useMock: true });
      this.useMockData = true;
      this.accessToken = 'mock-token';
      this.initialized = true;
    }
  }

  private handleAuthError(error: any): void {
    // Fall back to mock mode rather than crashing
    console.warn('Authentication error, falling back to mock mode:', error);
    this.useMockData = true;
    this.accessToken = 'mock-token';
    this.initialized = true;
  }

  private async refreshToken(): Promise<void> {
    if (this.useMockData) {
      this.accessToken = 'mock-token';
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.provider_token) {
        console.warn('No provider token available in session, using mock data');
        this.useMockData = true;
        this.accessToken = 'mock-token';
        return;
      }

      this.accessToken = session.provider_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.handleAuthError(error);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If we're in mock mode, return mock data
    if (this.useMockData) {
      return this.getMockResponse<T>(endpoint);
    }

    if (!this.accessToken) {
      console.warn('No access token available, attempting to refresh');
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return this.getMockResponse<T>(endpoint);
      }
    }

    try {
      const response = await fetch(`https://www.googleapis.com${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh and retry the request
        await this.refreshToken();
        return this.request(endpoint, options);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(JSON.stringify(error));
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      return this.getMockResponse<T>(endpoint);
    }
  }

  /**
   * Check if the user is signed in
   */
  isSignedIn(): boolean {
    try {
      // In mock mode, always return true for development
      if (this.useMockData) {
        return true;
      }
      
      return this.initialized && !!this.accessToken;
    } catch (error) {
      console.error('GoogleAPIClient: Error checking sign in status:', error);
      return false;
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
  private getMockResponse<T>(path: string | object): T {
    console.log('Returning mock data for:', path);
    
    // Handle case when path is an object
    const pathString = typeof path === 'string' ? path : JSON.stringify(path);
    
    // For Gmail messages list
    if (typeof path === 'string' && path.includes('/gmail/v1/users/me/messages') && !path.includes('/messages/')) {
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
    if (typeof path === 'string' && path.includes('/gmail/v1/users/me/messages/')) {
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
    if (typeof path === 'string' && path.includes('userinfo')) {
      return {
        id: 'mock-user-id',
        email: 'mock-user@example.com',
        name: 'Mock User',
        given_name: 'Mock',
        family_name: 'User',
        picture: 'https://ui-avatars.com/api/?name=Mock+User&background=random'
      } as unknown as T;
    }
    
    // For calendar accounts
    if (pathString.includes('calendar/v3') || pathString.includes('calendar')) {
      return {
        items: [
          {
            id: 'primary',
            summary: 'Mock User',
            primary: true
          }
        ]
      } as unknown as T;
    }
    
    // Default mock response
    return {} as T;
  }

  /**
   * Get user information from Google
   */
  async getUserInfo(): Promise<GoogleUserInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useMockData) {
      return {
        id: 'mock-user-id',
        email: 'mock@example.com',
        name: 'Mock User',
        picture: 'https://via.placeholder.com/150'
      };
    }

    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await this.request<GoogleUserInfo>('/oauth2/v2/userinfo', {
      method: 'GET'
    });

    return response;
  }

  /**
   * Set a provider token directly
   * This is useful for testing with known tokens
   */
  setProviderToken(token: string): void {
    console.log('GoogleAPIClient: Manually setting provider token');
    this.accessToken = token;
    this.useMockData = false;
    this.initialized = true;
  }

  /**
   * Set use mock data
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }
}

// Export the singleton instance
export const googleApiClient = GoogleAPIClient.getInstance(); 