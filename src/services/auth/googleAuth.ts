/**
 * Mock implementation of Google Auth service
 */

import { GoogleAPIClient } from '../google/GoogleAPIClient';

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private client: GoogleAPIClient;

  private constructor() {
    this.client = GoogleAPIClient.getInstance();
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
  }

  async signIn(): Promise<void> {
    await this.client.signIn();
  }

  async signOut(): Promise<void> {
    await this.client.signOut();
  }

  isSignedIn(): boolean {
    return this.client.isSignedIn();
  }

  async getAccessToken(): Promise<string> {
    return this.client.getAccessToken();
  }

  async request<T>(options: {
    path: string;
    method?: string;
    params?: Record<string, any>;
    body?: any;
  }): Promise<T> {
    return this.client.request(options);
  }

  getAuthUrl(): string {
    if (!this.client.getOAuth2Client()) {
      throw new Error('Auth client not initialized');
    }

    return this.client.getOAuth2Client().generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    });
  }

  async handleAuthCode(code: string): Promise<void> {
    if (!this.client.getOAuth2Client()) {
      throw new Error('Auth client not initialized');
    }

    const { tokens } = await this.client.getOAuth2Client().getToken(code);
    this.client.getOAuth2Client().setCredentials(tokens);

    if (tokens.access_token) {
      localStorage.setItem('google_access_token', tokens.access_token);
    }
  }

  getOAuth2Client(): GoogleAPIClient {
    if (!this.client.getOAuth2Client()) {
      throw new Error('Auth client not initialized');
    }
    return this.client.getOAuth2Client();
  }

  getConfig(): GoogleAuthConfig {
    return {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/callback`,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    };
  }
}

export const googleAuthService = GoogleAuthService.getInstance();