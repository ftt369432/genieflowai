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

const DEFAULT_SCOPES = 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

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

// ADDED for tokenResponse type
interface TokenClientResponse {
  access_token: string;
  [key: string]: any; // For other potential properties
}

/**
 * Google API Client for handling authentication and API requests
 */
export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private accessToken: string | null = null;
  private initialized = false;
  private useMockData = false;
  private isHybridMode = false;

  // Added declarations based on usage and linter errors
  private onAuthChangeCallback?: (isAuthenticated: boolean, token?: string) => void;
  private mockMode = false; // For initial setup and VITE_USE_MOCK
  private isAuthenticated = false;
  private gisClientId: string | undefined;
  private gapi: any; // Consider more specific type if known
  private gis: any; // Consider more specific type if known
  private tokenClient: any; // Consider more specific type if known

  // Add promise resolvers for the signIn method
  private signInPromiseResolve?: (value: void | PromiseLike<void>) => void;
  private signInPromiseReject?: (reason?: any) => void;

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
   * Check if we're in hybrid mode (both live and mock data)
   */
  isUsingHybridMode(): boolean {
    return this.isHybridMode;
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
  public async initialize(
    onAuthChange?: (isAuthenticated: boolean, token?: string) => void,
    scopes: string = DEFAULT_SCOPES,
    clientId?: string
  ): Promise<void> {
    if (onAuthChange) {
        this.onAuthChangeCallback = onAuthChange;
    }
    const envConfig = getEnv();
    console.log('[GoogleAPIClient_INIT_START] Initializing. getEnv().useMock:', envConfig.useMock, 'Class initial this.mockMode:', this.mockMode, 'Requested scopes:', scopes);

    // This assignment should be the primary driver for useMockData if not in forced mock mode later
    this.useMockData = envConfig.useMock === true || envConfig.useMock === 'hybrid';
    console.log('[GoogleAPIClient_INIT_CONFIG] this.useMockData set from envConfig.useMock:', this.useMockData);


    // If VITE_USE_MOCK was true, constructor doesn't set this.mockMode anymore, class property is false.
    // This block handles if mockMode was somehow set true externally AND it's already initialized.
    if (this.mockMode && this.initialized) { 
        console.log('[GoogleAPIClient_INIT_DEBUG] Condition: this.mockMode && this.initialized is TRUE. Bypassing.');
        if (this.onAuthChangeCallback) this.onAuthChangeCallback(false); 
        return;
    }
    // This block handles if mockMode was set true externally before first proper initialization.
     if (this.mockMode && !this.initialized) { 
      console.log('[GoogleAPIClient_INIT_DEBUG] Condition: this.mockMode && !this.initialized is TRUE. Initializing in forced mock mode.');
      this.initialized = true;
      this.isAuthenticated = false;
      this.useMockData = true; // Ensure useMockData is true if mockMode is forced here
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
      return;
    }

    // If envConfig.useMock is strictly true (not 'hybrid'), it implies full mock mode from the start.
    // We don't want to proceed with live initialization attempts if VITE_USE_MOCK=true.
    if (envConfig.useMock === true) {
      console.log('[GoogleAPIClient_INIT_ENV_MOCK_TRUE] envConfig.useMock is strictly true. Forcing full mock mode.');
      this.mockMode = true; // Set mockMode based on env
      this.useMockData = true; // Ensure useMockData is also true
      this.initialized = true;
      this.isAuthenticated = false;
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
      return;
    }

    // At this point, envConfig.useMock is either false or 'hybrid'. Proceed with live init attempts.
    console.log('[GoogleAPIClient_INIT_DEBUG] Proceeding with live initialization attempt.');

    try {
      this.gisClientId = clientId || envConfig.googleClientId;
      let supbaseSessionChecked = false;

      console.log('[GoogleAPIClient_INIT_GET_SESSION] Attempting to get Supabase session.');
      const { data: { session }, error } = await supabase.auth.getSession();
      supbaseSessionChecked = true;
      console.log('[GoogleAPIClient_INIT_GOT_SESSION] Supabase session received:', session ? 'Exists' : 'null', 'Error:', error);
      
      if (error) {
        console.warn('[GoogleAPIClient_INIT_SESSION_ERROR] Error getting Supabase session:', error); // Changed to warn
        // Do not force mock mode yet, GIS might still work if desired.
      }

      if (session && session.provider_token) {
        console.log('[GoogleAPIClient_INIT] Supabase provider_token found. This indicates user is signed in via Supabase/Google.');
        console.log('[GoogleAPIClient_INIT] However, this token will NOT be used directly for Google API calls by default.');
        console.log('[GoogleAPIClient_INIT] Explicit signIn() is required to get a GIS token with correct API scopes.');
        // IMPORTANT: We do NOT set this.accessToken or this.isAuthenticated = true here.
        // The GIS flow initiated by signIn() will be responsible for that.
        // We can, however, inform the app that a Supabase Google session exists.
        // This might be useful for UI state (e.g., "Signed in with Google via Supabase")
        // but not for API readiness.
        // if (this.onAuthChangeCallback) {
        //   this.onAuthChangeCallback(true, undefined); // True for "Supabase Google Auth exists", token is undefined for direct API use yet.
        // }
      } else {
        console.log('[GoogleAPIClient_INIT_NO_TOKEN_IN_SESSION] No Supabase provider_token in session.');
        // This means user is either not signed in with Supabase, or not with Google provider.
        // The GIS flow via signIn() will be the only way to get a Google token.
         if (this.onAuthChangeCallback) {
           // Reflect that, based on Supabase, no Google API ready token is available.
           // this.onAuthChangeCallback(false, undefined);
         }
      }
      
      await Promise.all([this.loadGapiScript(), this.loadGisScript()]);

      if (!this.gis) {
        console.error('[GoogleAPIClient_INIT_LIVE_ERROR] Google Identity Services (GIS) library not loaded.');
        this.forceMockMode('GIS library not loaded'); // forceMockMode will log its reason
        if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
        return;
      }

      // Initialize the GIS token client. This client is used by signIn() to request a token.
      console.log(`[GoogleAPIClient_INIT] Initializing GIS token client with scopes: ${scopes}`);
      this.tokenClient = this.gis.initTokenClient({
        client_id: this.gisClientId,
        scope: scopes, // Uses the scopes passed to initialize (e.g., DEFAULT_SCOPES from signIn)
        callback: (tokenResponse: TokenClientResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
            this.isAuthenticated = true; // GIS successfully provided a token
            console.log('[GoogleAPIClient_GIS_CALLBACK] Token received/refreshed via GIS:', this.accessToken ? 'Exists' : 'null');
            if (this.onAuthChangeCallback) {
              this.onAuthChangeCallback(true, this.accessToken);
            }
            // Resolve signIn promise if it exists
            if (this.signInPromiseResolve) {
              console.log('[GoogleAPIClient_GIS_CALLBACK] Resolving active signIn promise.');
              this.signInPromiseResolve();
              this.signInPromiseResolve = undefined;
              this.signInPromiseReject = undefined;
            }
          } else {
            console.error('[GoogleAPIClient_GIS_CALLBACK_ERROR] Failed to acquire token or error in GIS response.', tokenResponse);
            this.accessToken = null; // Clear any stale token
            this.isAuthenticated = false;
            if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
            // Reject signIn promise if it exists
            if (this.signInPromiseReject) {
              console.error('[GoogleAPIClient_GIS_CALLBACK_ERROR] Rejecting active signIn promise due to token acquisition failure.');
              this.signInPromiseReject(new Error('Failed to acquire token from GIS callback.'));
              this.signInPromiseResolve = undefined;
              this.signInPromiseReject = undefined;
            }
          }
        },
        error_callback: (gisError: any) => {
          console.error('[GoogleAPIClient_GIS_ERROR_CALLBACK] GIS Token Client error_callback:', gisError);
          this.accessToken = null; // Clear any stale token
          this.isAuthenticated = false;
          if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
          // Reject signIn promise if it exists
          if (this.signInPromiseReject) {
            console.error('[GoogleAPIClient_GIS_ERROR_CALLBACK] Rejecting active signIn promise due to GIS error.');
            this.signInPromiseReject(gisError);
            this.signInPromiseResolve = undefined;
            this.signInPromiseReject = undefined;
          }
        },
      });
      console.log('[GoogleAPIClient_INIT_LIVE] GIS Token Client initialized.');

      this.initialized = true; 
      this.mockMode = false;  // Explicitly false if we reached here successfully
      // this.useMockData would have been set by envConfig.useMock. If it was 'hybrid', it stays 'hybrid'.
      // If it was false, it stays false. If live init failed and forced mock, forceMockMode handles useMockData.
      console.log('[GoogleAPIClient_INIT_DEBUG] Live initialization part successful. this.mockMode:', this.mockMode, 'this.useMockData:', this.useMockData);

    } catch (err) {
      console.error('[GoogleAPIClient_INIT_CATCH_ERROR] General error during Google API Client live initialization:', err);
      this.forceMockMode('General init error');
      // Ensure auth state is false if we fall back to mock mode here
      // this.isAuthenticated = false; // forceMockMode handles this
      // if (this.onAuthChangeCallback) { // forceMockMode handles this
      //   this.onAuthChangeCallback(false);
      // }
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
      // Provide a default onAuthChange if not initialized through public entry point
      const defaultOnAuthChange = (auth: boolean, token?: string) => {
        console.log(`[GoogleAPIClient_INTERNAL_INIT] Auth state: ${auth}, token: ${token ? 'present' : 'absent'}`);
      };
      await this.initialize(this.onAuthChangeCallback || defaultOnAuthChange);
    }

    // If we're in pure mock mode (not hybrid), return only mock data
    if (this.useMockData && !this.isHybridMode) {
      return this.getMockResponse<T>(endpoint);
    }

    // For hybrid mode or live mode, try to get live data first
    if (this.isHybridMode || this.accessToken) {
      try {
        if (!this.accessToken) {
          console.warn('No access token available, attempting to refresh');
          try {
            await this.refreshToken(); // Attempt to refresh the token
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            if (this.isHybridMode) {
              console.warn('Hybrid mode: Falling back to mock data after refresh failure.');
              this.useMockData = true; // Fallback to mock
              return this.getMockResponse<T>(endpoint);
            } else {
              throw new Error('Authentication required and token refresh failed.');
            }
          }
        }

        // MODIFIED URL construction
        let requestUrl = endpoint;
        if (!endpoint.toLowerCase().startsWith('http')) {
          // Ensure we don't have leading slashes if endpoint is relative but starts with one
          const cleanedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
          requestUrl = `https://www.googleapis.com/${cleanedEndpoint}`;
        } else {
          // If it's already a full URL, use it directly
          // Potentially add a check here for the malformed 'https//' if it persists
          // For now, assume 'endpoint' is either a relative path or a correct full URL
        }
        
        console.log('[GoogleAPIClient_REQUEST] Making API call to:', requestUrl); // ADDED for debugging

        const response = await fetch(requestUrl, // MODIFIED to use requestUrl
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorBody = await response.text(); // Read error body as text
          console.error(`Google API request failed with status ${response.status}: ${response.statusText}. Body: ${errorBody}`);
          if (this.isHybridMode) {
            console.warn('Hybrid mode: API request failed, falling back to mock data.');
            this.useMockData = true; // Fallback to mock
            return this.getMockResponse<T>(endpoint);
          } else {
            throw new Error(`Google API request failed: ${response.statusText} - ${errorBody}`);
          }
        }
        return response.json() as Promise<T>;
      } catch (error) {
        console.error('Error during Google API request:', error);
        if (this.isHybridMode) {
          console.warn('Hybrid mode: Catching error, falling back to mock data.');
          this.useMockData = true; // Fallback to mock
          return this.getMockResponse<T>(endpoint);
        }
        throw error; // Re-throw if not in hybrid mode
      }
    }

    // If not hybrid and no access token (should have been caught earlier, but as a safeguard)
    throw new Error('Google API client not authenticated and not in hybrid/mock mode.');
  }

  /**
   * Check if the user is signed in
   */
  isSignedIn(): boolean {
    if (this.useMockData) {
      // In mock mode, you might want to simulate a signed-in state or delegate to a mock implementation
      return true; // Or false, depending on your mock setup needs
    }
    return !!this.accessToken && this.isAuthenticated;
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    console.log("[GoogleAPIClient_SIGN_OUT_START] Attempting to sign out.");
    if (this.useMockData) {
      this.accessToken = null;
      this.isAuthenticated = false;
      if (this.onAuthChangeCallback) {
        this.onAuthChangeCallback(false);
      }
      console.log("[GoogleAPIClient_SIGN_OUT_MOCK] Signed out in mock mode.");
      return;
    }

    // For GIS OAuth2 token client, revoking the token is a good practice if API available
    // and if the token is not self-managed to expire quickly.
    if (this.gis && typeof this.gis.revoke === 'function' && this.accessToken) {
      try {
        // Note: The method might be on google.accounts.oauth2.revoke, not this.gis.revoke directly.
        // This assumes `this.gis` has been set to `google.accounts.oauth2` and `revoke` is a valid method.
        // Example: await (window as any).google.accounts.oauth2.revoke(this.accessToken, () => { console.log('Token revoked'); });
        // For now, let's log the intent and proceed with local clear.
        console.log('[GoogleAPIClient_SIGN_OUT_GIS_REVOKE_ATTEMPT] Attempting to revoke GIS token (if applicable method exists).');
        // If a specific revoke method for tokenClient exists, it would be used here.
        // Since `initTokenClient` doesn't return a specific sign-out method for itself,
        // clearing the token is the primary client-side responsibility.
      } catch (error) {
        console.error("[GoogleAPIClient_SIGN_OUT_GIS_REVOKE_ERROR] Error during GIS token revocation:", error);
      }
    }
    
    // If GIS ID client was used for Sign In with Google button (not yet integrated here from GoogleIdentityClient)
    // then `google.accounts.id.disableAutoSelect()` would be relevant here.

    this.accessToken = null;
    this.isAuthenticated = false;
    if (this.onAuthChangeCallback) {
      this.onAuthChangeCallback(false, undefined);
    }
    console.log("[GoogleAPIClient_SIGN_OUT_COMPLETE] Local sign-out state cleared.");
  }

  /**
   * Get mock response for development
   */
  private getMockResponse<T>(path: string | object): T {
    const endpoint = typeof path === 'string' ? path : JSON.stringify(path);
    console.log(`[GoogleAPIClient_MOCK_RESPONSE] Returning mock data for endpoint: ${endpoint}`);

    if (endpoint.includes('/oauth2/v2/userinfo')) {
      return {
        id: 'mock-user-id',
        email: 'mock.user@example.com',
        name: 'Mock User',
        given_name: 'Mock',
        family_name: 'User',
        picture: 'https://via.placeholder.com/150',
      } as unknown as T;
    } else if (endpoint.includes('/gmail/v1/users/me/messages')) {
      // Example for listing messages
      return {
        messages: [
          { id: 'mock-msg-1', threadId: 'mock-thread-1' },
          { id: 'mock-msg-2', threadId: 'mock-thread-2' },
        ],
        nextPageToken: null,
        resultSizeEstimate: 2,
      } as unknown as T;
    } else if (endpoint.startsWith('/gmail/v1/users/me/messages/')) {
      // Example for getting a specific message (very basic)
      const messageId = endpoint.split('/').pop();
      return {
        id: messageId,
        threadId: `mock-thread-for-${messageId}`,
        snippet: 'This is a mock email snippet.',
        payload: {
          headers: [
            { name: 'Subject', value: 'Mock Email Subject' },
            { name: 'From', value: 'sender@example.com' },
            { name: 'To', value: 'receiver@example.com' },
          ],
          body: { data: btoa('This is the mock email body.') }, // base64 encoded
        },
      } as unknown as T;
    } else if (endpoint.includes('/calendar/v3/calendars/primary/events')) {
      // Added mock for calendar events list
      return {
        kind: "calendar#events",
        etag: "\"p32ofphf9jad1g00\"",
        summary: "primary",
        updated: new Date().toISOString(),
        timeZone: "America/Los_Angeles",
        accessRole: "owner",
        defaultReminders: [],
        nextSyncToken: "next-sync-token-mock",
        items: [
          {
            kind: "calendar#event",
            etag: "\"mockeventetag1\"",
            id: "mockeventid1",
            status: "confirmed",
            htmlLink: "https://www.google.com/calendar/event?eid=mockeventid1",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            summary: "Mock Calendar Event 1",
            description: "This is a mock event from GoogleAPIClient.",
            creator: { email: "mock.creator@example.com", self: true },
            organizer: { email: "mock.organizer@example.com", self: true },
            start: { dateTime: new Date(Date.now() + 3600000).toISOString(), timeZone: "America/Los_Angeles" },
            end: { dateTime: new Date(Date.now() + 7200000).toISOString(), timeZone: "America/Los_Angeles" },
            iCalUID: "mockeventid1@google.com",
            sequence: 0,
            reminders: { useDefault: true },
            eventType: "default"
          }
        ]
      } as unknown as T;
    }
    // Fallback for unknown mock endpoints
    console.warn(`[GoogleAPIClient_MOCK_RESPONSE] No specific mock for endpoint: ${endpoint}. Returning empty object.`);
    return {} as T;
  }

  /**
   * Get user information from Google
   */
  async getUserInfo(): Promise<GoogleUserInfo> {
    if (!this.gapi || !this.initialized) {
      console.warn('[GoogleAPIClient_GET_USER_INFO] GAPI not loaded or client not initialized. Attempting re-init.');
      const defaultOnAuthChange = (auth: boolean, token?: string) => {
        console.log(`[GoogleAPIClient_INTERNAL_INIT_USER_INFO] Auth state: ${auth}, token: ${token ? 'present' : 'absent'}`);
      };
      await this.initialize(this.onAuthChangeCallback || defaultOnAuthChange); // Or handle error appropriately
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

    // Use the generic request method for fetching user info
    const userInfo = await this.request<GoogleUserInfo>('/oauth2/v2/userinfo', {
      method: 'GET',
    });

    return userInfo;
  }

  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  // ADDED Missing method declarations
  private async loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        this.gapi = (window as any).gapi;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js'; // Standard GAPI script
      script.onload = () => {
        if (typeof window !== 'undefined') {
          this.gapi = (window as any).gapi;
          // GAPI needs to be initialized with client:init after loading
          this.gapi.load('client', () => {
             // You might need to initialize the client here if not done elsewhere
             // For example: this.gapi.client.init({ apiKey: 'YOUR_API_KEY', clientId: this.gisClientId, discoveryDocs: [...] scope: ... })
             // However, for many modern use cases, GIS handles auth and token, and gapi is used more for specific older API calls.
             // If you only need GIS for auth and access tokens, gapi.client.init might not be strictly necessary here.
            console.log('[GoogleAPIClient] GAPI script loaded and client library initialized.');
            resolve();
          });
        } else {
          reject(new Error('GAPI script loaded but window.gapi not found.'));
        }
      };
      script.onerror = () => {
        console.error('[GoogleAPIClient_ERROR] Failed to load GAPI script.');
        reject(new Error('Failed to load GAPI script.'));
      };
      document.body.appendChild(script);
    });
  }

  
  private async loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already loaded, just assign and resolve
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        this.gis = (window as any).google.accounts.oauth2;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if ((window as any).google?.accounts?.oauth2) {
          this.gis = (window as any).google.accounts.oauth2;
          resolve();
        } else {
          reject(new Error('GIS script loaded but oauth2 object not found.'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load GIS script.'));
      };
      document.body.appendChild(script);
    });
  }

  private forceMockMode(reason?: string): void {
    console.warn(`[GoogleAPIClient_FORCE_MOCK_MODE] Forcing mock mode. Reason: ${reason || 'Unspecified'}`);
    this.mockMode = true;
    this.useMockData = true; // Typically, forcing mockMode implies useMockData
    this.isAuthenticated = false;
    this.initialized = true; // It's initialized, albeit in mock mode
    if (this.onAuthChangeCallback) {
      this.onAuthChangeCallback(false);
    }
  }

  async getAuthInstance(): Promise<any> {
    if (!this.initialized) {
      const defaultOnAuthChange = (auth: boolean, token?: string) => {
        console.log(`[GoogleAPIClient_INTERNAL_INIT_AUTH_INSTANCE] Auth state: ${auth}, token: ${token ? 'present' : 'absent'}`);
      };
      await this.initialize(this.onAuthChangeCallback || defaultOnAuthChange);
    }
    return this.gapi?.auth2?.getAuthInstance();
  }

  async signIn(): Promise<void> {
    if (this.useMockData && !this.isHybridMode) { // Only full mock mode bypasses signIn
      console.log("[GoogleAPIClient_SIGN_IN_MOCK] Signed in (mock mode).");
      this.isAuthenticated = true; // Simulate for mock
      if (this.onAuthChangeCallback) this.onAuthChangeCallback(true, "mock-token");
      return Promise.resolve(); // Return a resolved promise for mock mode
    }

    console.log("[GoogleAPIClient_SIGN_IN] Attempting explicit Google sign-in for API scopes.");
    
    // Return a new promise that will be resolved/rejected by the GIS callback
    return new Promise<void>(async (resolve, reject) => {
      this.signInPromiseResolve = resolve;
      this.signInPromiseReject = reject;

      try {
        console.log(`[GoogleAPIClient_SIGN_IN] Calling initialize to ensure GIS client is ready with DEFAULT_SCOPES: ${DEFAULT_SCOPES}`);
        await this.initialize(this.onAuthChangeCallback, DEFAULT_SCOPES, this.gisClientId);

        if (this.tokenClient) {
          console.log("[GoogleAPIClient_SIGN_IN] Requesting access token via GIS token client. Configured for scopes: ", DEFAULT_SCOPES);
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
          // The promise (resolve/reject) will be handled by the GIS callback in initialize()
        } else {
          console.error("[GoogleAPIClient_SIGN_IN_ERROR] Token client not available after initialize. Cannot initiate Google Sign-In.");
          this.isAuthenticated = false; 
          if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
          // Reject the promise if tokenClient is not available
          if (this.signInPromiseReject) {
            this.signInPromiseReject(new Error("Token client not available for sign-In."));
          }
          this.signInPromiseResolve = undefined; // Clear resolvers
          this.signInPromiseReject = undefined;
        }
      } catch (initError) {
        console.error("[GoogleAPIClient_SIGN_IN_ERROR] Failed to initialize for sign-in:", initError);
        this.isAuthenticated = false; 
        if (this.onAuthChangeCallback) this.onAuthChangeCallback(false);
        // Reject the promise on initialization error
        if (this.signInPromiseReject) {
            this.signInPromiseReject(initError);
        }
        this.signInPromiseResolve = undefined; // Clear resolvers
        this.signInPromiseReject = undefined;
      }
    });
  }
}

// Ensure a single instance is exported
// const googleAPIClient = GoogleAPIClient.getInstance(); // This was commented out, preserving that
export const googleApiClient = GoogleAPIClient.getInstance(); // Keep one export