/**
 * Google Authentication Service
 * 
 * Handles the OAuth2 flow with Google, including:
 * - Generating authorization URLs
 * - Handling auth callbacks
 * - Managing tokens
 */

import { getEnv } from "../../config/env";
import { GoogleAPIClient } from "../google/GoogleAPIClient";
import { supabase } from "../supabase/supabaseClient";

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

// Type for the mock user setter function
type MockUserSetter = (userData: { id: string; email: string; fullName?: string }) => void;

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private googleClient: GoogleAPIClient;
  private ready: boolean = false;
  private initialized: boolean = false;
  private isStable: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Redirect URI for OAuth flow
  private redirectUri: string = '';
  private clientId: string = '';
  
  // Default scopes for authentication
  private defaultScopes: string[] = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/cloud-language',
    'https://www.googleapis.com/auth/generative-language.tuning',
    'https://www.googleapis.com/auth/generative-language.runtime'
  ];

  private mockUserSetter: MockUserSetter | null = null;

  private constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
    
    // Set a timeout to ensure UI stabilizes
    setTimeout(() => {
      this.isStable = true;
    }, 500);
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initialize the Google auth service
   */
  async initialize(): Promise<void> {
    // If already initialized, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const { useMock, googleClientId } = getEnv();
    
    if (this.initialized) {
      console.log('GoogleAuthService: Already initialized');
      return;
    }
    
    console.log('GoogleAuthService: Initializing');
    
    // Create a new promise for initialization
    this.initializationPromise = (async () => {
      try {
        // Set up the client
        await this.googleClient.initialize();
        
        // Set up service properties
        this.clientId = googleClientId || '';
        this.redirectUri = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
        
        // Mark as initialized
        this.initialized = true;
        this.ready = true;
        
        console.log('GoogleAuthService: Initialization complete');
        console.log('Redirect URI:', this.redirectUri);
      } catch (error) {
        console.error('GoogleAuthService: Initialization error:', error);
        // Mark as initialized anyway to avoid infinite retries
        this.initialized = true;
        this.ready = false;
        throw error; // Re-throw to allow error handling
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<void> {
    const { useMock } = getEnv();
    
    if (useMock) {
      console.log('GoogleAuthService: Mock mode, simulating successful sign in');
      if (this.mockUserSetter) {
        this.mockUserSetter({
          id: 'mock-google-user',
          email: 'mockuser@gmail.com',
          fullName: 'Mock Google User'
        });
      }
      return;
    }
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Use Supabase's Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.redirectUri,
          scopes: this.defaultScopes.join(' ')
        }
      });
      
      if (error) {
        throw error;
      }
      
      // The signInWithOAuth method will handle the redirect automatically
    } catch (error) {
      console.error('GoogleAuthService: Error during sign in:', error);
      throw error;
    }
  }

  /**
   * Handle the authorization code from the OAuth callback
   */
  async handleAuthCode(code: string): Promise<string> {
    const { useMock } = getEnv();
    
    if (useMock) {
      console.log('GoogleAuthService: Mock mode, skipping auth code handling');
      return 'mock-token';
    }
    
    // With Supabase OAuth, we don't need to handle the code manually
    // Supabase will handle the token exchange automatically
    // This method is kept for backward compatibility
    return 'handled-by-supabase';
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    console.log('GoogleAuthService: Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('GoogleAuthService: Error during sign out:', error);
      throw error;
    }
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('GoogleAuthService: Error checking sign in status:', error);
      return false;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch (error) {
      console.error('GoogleAuthService: Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Set the mock user setter function
   */
  setMockUserSetter(setter: MockUserSetter): void {
    this.mockUserSetter = setter;
    console.log('GoogleAuthService: Mock user setter registered');
  }
}

// Export the singleton instance
const googleAuthService = GoogleAuthService.getInstance();
export default googleAuthService;