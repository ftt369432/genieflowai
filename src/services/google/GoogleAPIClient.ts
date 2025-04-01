/**
 * GoogleAPIClient.ts
 * 
 * This class handles authentication and API calls to Google services.
 * For development and testing, this uses mock data when environment variables aren't available.
 */

import { getEnv } from '../../config/env';

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
  picture: string;
}

// Interface for request options
interface RequestOptions {
  path: string;
  params?: Record<string, any>;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Google API Client for handling authentication and API requests
 */
export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private accessToken: string | null = null;
  private oauth2Client: any = null;
  private gapi: any = null;
  private isInitialized: boolean = false;
  private isAuthenticated: boolean = false;

  private constructor() {}

  /**
   * Get instance (singleton)
   */
  static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  /**
   * Initialize the Google API client
   */
  async initialize(): Promise<void> {
    const { useMock } = getEnv();
    
    if (useMock) {
      console.log('GoogleAPIClient: Running in mock mode');
      this.isInitialized = true;
      return;
    }
    
    try {
      console.log('GoogleAPIClient: Initializing Google API client');
      
      // Check if gapi is available
      if (typeof window !== 'undefined' && window.gapi) {
        this.gapi = window.gapi;
        
        // Load the necessary libraries
        await new Promise<void>((resolve, reject) => {
          this.gapi.load('client:auth2', {
            callback: () => {
              console.log('GoogleAPIClient: Google API client loaded');
              resolve();
            },
            onerror: (err: any) => {
              console.error('GoogleAPIClient: Error loading Google API client', err);
              reject(new Error('Failed to load Google API client'));
            }
          });
        });
        
        // Initialize the client
        await this.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.modify'
          ].join(' '),
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
        });
        
        // Get the OAuth2 client
        this.oauth2Client = this.gapi.auth2.getAuthInstance();
        
        // Check if the user is signed in
        this.isAuthenticated = this.oauth2Client.isSignedIn.get();
        
        if (this.isAuthenticated) {
          const googleUser = this.oauth2Client.currentUser.get();
          const authResponse = googleUser.getAuthResponse(true);
          this.accessToken = authResponse.access_token;
          console.log('GoogleAPIClient: User is already signed in');
        } else {
          console.log('GoogleAPIClient: User is not signed in');
        }
        
        this.isInitialized = true;
        console.log('GoogleAPIClient: Initialization complete');
      } else {
        console.warn('GoogleAPIClient: Google API client not available');
        throw new Error('Google API client not available');
      }
    } catch (error) {
      console.error('GoogleAPIClient: Error initializing', error);
      throw error;
    }
  }

  /**
   * Sign in the user
   */
  async signIn(): Promise<void> {
    const { useMock } = getEnv();
    
    if (useMock) {
      this.isAuthenticated = true;
      this.accessToken = 'mock-access-token';
      return;
    }
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (!this.oauth2Client) {
        throw new Error('OAuth2 client not initialized');
      }
      
      // Perform the sign in
      const googleUser = await this.oauth2Client.signIn({
        prompt: 'select_account'
      });
      
      // Get the auth response
      const authResponse = googleUser.getAuthResponse(true);
      this.accessToken = authResponse.access_token;
      this.isAuthenticated = true;
      
      console.log('GoogleAPIClient: Sign in successful');
    } catch (error) {
      console.error('GoogleAPIClient: Error signing in', error);
      throw error;
    }
  }

  /**
   * Sign out the user
   */
  async signOut(): Promise<void> {
    const { useMock } = getEnv();
    
    if (useMock) {
      this.isAuthenticated = false;
      this.accessToken = null;
      return;
    }
    
    try {
      if (!this.isInitialized || !this.oauth2Client) {
        throw new Error('OAuth2 client not initialized');
      }
      
      await this.oauth2Client.signOut();
      this.isAuthenticated = false;
      this.accessToken = null;
      
      console.log('GoogleAPIClient: Sign out successful');
    } catch (error) {
      console.error('GoogleAPIClient: Error signing out', error);
      throw error;
    }
  }

  /**
   * Check if the user is signed in
   */
  isSignedIn(): boolean {
    const { useMock } = getEnv();
    
    if (useMock) {
      return this.isAuthenticated;
    }
    
    if (!this.isInitialized || !this.oauth2Client) {
      return false;
    }
    
    return this.oauth2Client.isSignedIn.get();
  }

  /**
   * Get the access token
   */
  async getAccessToken(): Promise<string> {
    const { useMock } = getEnv();
    
    if (useMock) {
      return 'mock-access-token';
    }
    
    if (!this.isInitialized || !this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
    
    if (!this.isSignedIn()) {
      throw new Error('User not signed in');
    }
    
    // Refresh the token if needed
    const googleUser = this.oauth2Client.currentUser.get();
    const authResponse = googleUser.getAuthResponse(true);
    
    if (!authResponse.access_token) {
      throw new Error('Failed to get access token');
    }
    
    this.accessToken = authResponse.access_token;
    return this.accessToken as string;
  }

  /**
   * Make a request to the Google API
   */
  async request<T>(options: {
    path: string;
    method?: string;
    params?: Record<string, any>;
    body?: any;
  }): Promise<T> {
    const { useMock } = getEnv();
    
    if (useMock) {
      // Return mock data
      console.log('GoogleAPIClient: Mock request', options);
      return { email: 'user@gmail.com', name: 'Mock User' } as unknown as T;
    }
    
    if (!this.isInitialized) {
      throw new Error('Google API client not initialized');
    }
    
    if (!this.accessToken) {
      await this.getAccessToken();
    }
    
    const { path, method = 'GET', params, body } = options;
    
    try {
      // If gapi client is available, use it
      if (this.gapi && this.gapi.client) {
        const request = {
          path,
          method,
          params,
          body,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        };
        
        const response = await this.gapi.client.request(request);
        return response.result as T;
      }
      
      // Fallback to fetch API
      const url = new URL(path);
      
      // Add query parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('GoogleAPIClient: Error making request', error);
      throw error;
    }
  }

  /**
   * Get the OAuth2 client
   */
  getOAuth2Client(): any {
    return this.oauth2Client;
  }
}

// Export the singleton instance
export const googleApiClient = GoogleAPIClient.getInstance(); 