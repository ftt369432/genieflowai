interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class GoogleIdentityClient {
  private static instance: GoogleIdentityClient;
  private initialized = false;
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null;

  private constructor() {}

  static getInstance(): GoogleIdentityClient {
    if (!GoogleIdentityClient.instance) {
      GoogleIdentityClient.instance = new GoogleIdentityClient();
    }
    return GoogleIdentityClient.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the Google Identity Services client
      await new Promise<void>((resolve, reject) => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this),
          });
          resolve();
        } else {
          reject(new Error('Google Identity Services not loaded'));
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error);
      throw error;
    }
  }

  private async handleCredentialResponse(response: any) {
    this.accessToken = response.credential;
    this.tokenExpiryTime = Date.now() + 3600000; // 1 hour expiry
  }

  async signIn(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error('Sign in prompt not displayed or skipped'));
          }
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async signOut(): Promise<void> {
    window.google.accounts.id.disableAutoSelect();
    this.accessToken = null;
    this.tokenExpiryTime = null;
  }

  async isSignedIn(): Promise<boolean> {
    return !!(this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime);
  }

  async request<T>(params: {
    path: string;
    method?: string;
    params?: Record<string, any>;
  }): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = new URL(params.path);
    if (params.params) {
      Object.entries(params.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: params.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }
} 