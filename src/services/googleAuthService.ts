import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleClientId } from './firebaseConfig';

// Singleton instance of Google Auth
let _googleAuthInstance: GoogleAuth | null = null;

class GoogleAuth {
  private accessToken: string | null = null;
  private user: any = null;
  private tokenExpiryTime: number = 0;
  private isInitialized: boolean = false;
  private useMockMode: boolean = false;

  constructor() {
    console.log("GoogleAuth: Constructor called");
    this.initialize();
  }
  
  async initialize() {
    console.log("GoogleAuth: Initializing");
    try {
      // Check if there's a saved token in localStorage
      const savedToken = localStorage.getItem('googleAccessToken');
      const tokenExpiry = localStorage.getItem('googleTokenExpiry');
      const savedUser = localStorage.getItem('googleUser');
      
      if (savedToken && tokenExpiry && savedUser) {
        this.accessToken = savedToken;
        this.tokenExpiryTime = parseInt(tokenExpiry);
        this.user = JSON.parse(savedUser);
        console.log("GoogleAuth: Loaded saved credentials");
      }
      
      // Check if we should use mock mode
      this.useMockMode = 
        import.meta.env.VITE_USE_MOCK === 'true' || 
        localStorage.getItem('useMockMode') === 'true';
        
      if (this.useMockMode) {
        console.log("GoogleAuth: Using mock mode");
      }
      
      this.isInitialized = true;
      console.log("GoogleAuth: Initialization complete");
    } catch (error) {
      console.error("GoogleAuth: Error during initialization", error);
      this.useMockMode = true;
    }
  }

  /**
   * Check if the user is authenticated with Google
   */
  isAuthenticated(): boolean {
    return this.useMockMode || (!!this.accessToken && Date.now() < this.tokenExpiryTime);
  }

  /**
   * Check if using mock mode
   */
  isMockMode(): boolean {
    return this.useMockMode;
  }

  /**
   * Set mock mode
   */
  setMockMode(useMock: boolean): void {
    this.useMockMode = useMock;
    localStorage.setItem('useMockMode', useMock ? 'true' : 'false');
    console.log(`GoogleAuth: Mock mode ${useMock ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string {
    if (this.useMockMode) {
      return 'mock-token-for-development';
    }
    
    if (!this.isAuthenticated()) {
      console.warn("GoogleAuth: Not authenticated, returning empty token");
      return '';
    }
    
    return this.accessToken!;
  }

  /**
   * Get the current user
   */
  getUser(): any {
    if (this.useMockMode) {
      return {
        displayName: 'Mock User',
        email: 'mock@example.com',
        photoURL: 'https://via.placeholder.com/150',
        uid: 'mock-user-id'
      };
    }
    
    return this.user;
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<void> {
    console.log("GoogleAuth: Sign in process started");
    
    if (this.useMockMode) {
      console.log("GoogleAuth: Using mock sign-in");
      this.user = {
        displayName: 'Mock User',
        email: 'mock@example.com',
        photoURL: 'https://via.placeholder.com/150',
        uid: 'mock-user-id'
      };
      this.accessToken = 'mock-token-for-development';
      this.tokenExpiryTime = Date.now() + 3600000;
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      
      // Add scopes for Google Drive access
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      
      // Use the client ID from env
      provider.setCustomParameters({
        client_id: googleClientId,
        prompt: 'consent'
      });
      
      console.log("GoogleAuth: Opening popup for authentication");
      const result = await signInWithPopup(auth, provider);
      console.log("GoogleAuth: Authentication successful");
      
      // Get the Google OAuth access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential) {
        throw new Error('Failed to get Google credential');
      }
      
      this.accessToken = credential.accessToken || null;
      this.user = result.user;
      
      // Set token expiry to 1 hour from now
      this.tokenExpiryTime = Date.now() + 3600000;
      
      // Save to localStorage
      if (this.accessToken) {
        localStorage.setItem('googleAccessToken', this.accessToken);
        localStorage.setItem('googleTokenExpiry', this.tokenExpiryTime.toString());
        localStorage.setItem('googleUser', JSON.stringify(this.user));
        console.log("GoogleAuth: Credentials saved to localStorage");
      }
    } catch (error: unknown) {
      console.error('GoogleAuth: Error signing in with Google:', error);
      
      // Handle specific Firebase auth errors
      if (error instanceof FirebaseError) {
        // Handle Firebase-specific errors
        const errorCode = error.code;
        if (errorCode === 'auth/popup-closed-by-user') {
          console.log("GoogleAuth: Authentication popup was closed by the user");
        } else if (errorCode === 'auth/cancelled-popup-request') {
          console.log("GoogleAuth: Authentication popup request was cancelled");
        } else if (errorCode === 'auth/popup-blocked') {
          console.error("GoogleAuth: Authentication popup was blocked. Please allow popups for this site.");
        } else {
          console.error(`GoogleAuth: Authentication error: ${errorCode}`);
        }
      } else {
        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`GoogleAuth: Non-Firebase authentication error: ${errorMessage}`);
      }
      
      // If we get an error, fallback to mock mode
      console.log("GoogleAuth: Falling back to mock mode after authentication error");
      this.setMockMode(true);
      this.user = {
        displayName: 'Mock User (Fallback)',
        email: 'mock@example.com',
        photoURL: 'https://via.placeholder.com/150',
        uid: 'mock-user-id'
      };
      this.accessToken = 'mock-token-for-development';
      this.tokenExpiryTime = Date.now() + 3600000;
    }
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    console.log("GoogleAuth: Signing out");
    this.accessToken = null;
    this.user = null;
    this.tokenExpiryTime = 0;
    
    // Remove from localStorage
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleTokenExpiry');
    localStorage.removeItem('googleUser');
    
    // Don't call auth.signOut() if we're in mock mode to avoid errors
    if (!this.useMockMode) {
      try {
        auth.signOut();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`GoogleAuth: Error during sign out: ${errorMessage}`);
      }
    }
    
    console.log("GoogleAuth: Sign out complete");
  }
}

/**
 * Get the Google Auth instance (singleton)
 */
export function getGoogleAuthInstance(): GoogleAuth {
  console.log("GoogleAuth: Getting instance");
  if (!_googleAuthInstance) {
    console.log("GoogleAuth: Creating new instance");
    _googleAuthInstance = new GoogleAuth();
  }
  return _googleAuthInstance;
} 