import { GoogleAPIClient, GoogleUserInfo } from './GoogleAPIClient';
import { getEnv } from '../../config/env';

/**
 * Service for fetching Google user profile information
 */
export class GoogleUserProfileService {
  private static instance: GoogleUserProfileService;
  private googleApiClient: GoogleAPIClient;

  private constructor() {
    this.googleApiClient = GoogleAPIClient.getInstance();
  }

  static getInstance(): GoogleUserProfileService {
    if (!GoogleUserProfileService.instance) {
      GoogleUserProfileService.instance = new GoogleUserProfileService();
    }
    return GoogleUserProfileService.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.googleApiClient.initialize();
  }

  /**
   * Check if the user is signed in to Google
   */
  isSignedIn(): boolean {
    return this.googleApiClient.isSignedIn();
  }

  /**
   * Get the user's Google profile information
   * Includes name, email, and profile picture
   */
  async getUserProfile(): Promise<GoogleUserInfo> {
    const { useMock } = getEnv();

    if (useMock) {
      // Return mock data
      return {
        id: 'mock-user-id',
        email: 'user@gmail.com',
        name: 'Mock User',
        picture: `https://ui-avatars.com/api/?name=Mock+User&background=random`
      };
    }

    try {
      // Make sure the user is signed in
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google');
      }

      // Fetch the user's profile from Google
      const userInfo = await this.googleApiClient.request<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { method: 'GET' }
      );

      return userInfo;
    } catch (error) {
      console.error('Failed to fetch Google user profile:', error);
      throw error;
    }
  }

  /**
   * Get just the user's profile picture URL
   */
  async getProfilePictureUrl(): Promise<string> {
    try {
      const profile = await this.getUserProfile();
      if (!profile.picture) {
        console.warn('User profile picture not found.');
        return '';
      }
      return profile.picture;
    } catch (error) {
      console.error('Failed to fetch Google profile picture:', error);
      throw error;
    }
  }

  /**
   * Sign in the user to Google
   */
  async signIn(): Promise<void> {
    await this.googleApiClient.signIn();
  }

  /**
   * Sign out the user from Google
   */
  async signOut(): Promise<void> {
    await this.googleApiClient.signOut();
  }
}

// Export the singleton instance
export const googleUserProfileService = GoogleUserProfileService.getInstance(); 