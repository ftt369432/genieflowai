declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private initialized = false;
  private clientId: string;
  private apiKey: string;
  private tokenClient: any;
  private discoveryDocs = [
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  ];
  private scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive.file'
  ];

  private constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

    if (!this.clientId) {
      throw new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
    }

    if (!this.apiKey) {
      throw new Error('Google API Key is not configured. Please set VITE_GOOGLE_API_KEY in your .env file.');
    }
  }

  static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const handleError = (error: Error) => {
        console.error('Google API initialization error:', error);
        reject(error);
      };

      // Load the Google Identity Services script
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        // Load the Google API client script
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => this.initializeGapi(resolve, handleError);
        gapiScript.onerror = () => handleError(new Error('Failed to load Google API client'));
        document.body.appendChild(gapiScript);
      };
      gisScript.onerror = () => handleError(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(gisScript);
    });
  }

  private async initializeGapi(resolve: () => void, reject: (error: Error) => void): Promise<void> {
    try {
      await new Promise<void>((res, rej) => {
        window.gapi.load('client', {
          callback: res,
          onerror: () => rej(new Error('Failed to load GAPI client')),
          timeout: 5000,
          ontimeout: () => rej(new Error('Failed to load GAPI client - timeout'))
        });
      });

      await window.gapi.client.init({
        apiKey: this.apiKey,
        discoveryDocs: this.discoveryDocs
      }).catch((error: any) => {
        console.error('GAPI client init error:', error);
        throw new Error(`Failed to initialize GAPI client: ${error.message || 'Unknown error'}`);
      });

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scopes.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(`Token error: ${tokenResponse.error}`));
            return;
          }
          this.initialized = true;
          resolve();
        }
      });

      this.initialized = true;
      resolve();
    } catch (error) {
      console.error('Google API initialization error:', error);
      reject(error instanceof Error ? error : new Error('Failed to initialize Google API client'));
    }
  }

  async signIn(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.requestAccessToken({
          prompt: 'consent',
          error_callback: (error: any) => {
            console.error('Sign in error:', error);
            reject(new Error(`Sign in failed: ${error.message || 'Unknown error'}`));
          }
        });
        resolve();
      } catch (error) {
        console.error('Sign in error:', error);
        reject(error instanceof Error ? error : new Error('Sign in failed'));
      }
    });
  }

  async signOut(): Promise<void> {
    if (!this.initialized) return;
    
    try {
      const token = window.gapi.client.getToken();
      if (token) {
        window.google.accounts.oauth2.revoke(token.access_token);
        window.gapi.client.setToken(null);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error instanceof Error ? error : new Error('Sign out failed');
    }
  }

  isSignedIn(): boolean {
    return this.initialized && !!window.gapi.client.getToken();
  }

  async getAccessToken(): Promise<string> {
    if (!this.initialized || !this.isSignedIn()) {
      throw new Error('Not authenticated');
    }
    const token = window.gapi.client.getToken();
    return token?.access_token;
  }

  async request<T>(options: {
    path: string;
    method?: string;
    params?: Record<string, any>;
    body?: any;
  }): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.isSignedIn()) {
      await this.signIn();
    }

    const { path, method = 'GET', params = {}, body } = options;

    try {
      const response = await window.gapi.client.request({
        path,
        method,
        params,
        body
      });

      return response.result;
    } catch (error: any) {
      console.error('API request error:', error);
      throw new Error(error.message || 'API request failed');
    }
  }
} 