/**
 * GoogleAPIClient.ts
 * 
 * This class handles authentication and API calls to Google services using Supabase Auth.
 */

import { supabase } from '../../lib/supabase';

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

  private constructor() {}

  static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
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
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get the session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Failed to get session:', error);
        throw error;
      }

      if (!session) {
        console.warn('No session available');
        return;
      }

      // Check if we have a provider token
      if (!session.provider_token) {
        console.warn('No provider token available');
        console.log('To use Google services, you need to sign in with Google OAuth and grant permissions.');
        return;
      }

      this.accessToken = session.provider_token;
      this.initialized = true;
      console.log('Successfully connected to Google services.');
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  /**
   * Refresh the token from Supabase session
   */
  private async refreshToken(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.provider_token) {
        console.warn('No provider token available in session');
        return;
      }

      this.accessToken = session.provider_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated request to Google API
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.accessToken) {
      console.warn('No access token available, attempting to refresh');
      await this.refreshToken();
      
      if (!this.accessToken) {
        throw new Error('Authentication required. Please sign in with Google.');
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

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Check if the user is signed in
   */
  isSignedIn(): boolean {
    return !!this.accessToken;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.accessToken = null;
    this.initialized = false;
    await supabase.auth.signOut();
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<GoogleUserInfo> {
    return this.request<GoogleUserInfo>('/oauth2/v1/userinfo?alt=json');
  }
}

// Export the singleton instance
export const googleApiClient = GoogleAPIClient.getInstance();