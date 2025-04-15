/**
 * Google API Services index
 * 
 * This file exports the Google API client and related services for Gmail, Calendar, etc.
 * Use these services for all Google API interactions in the application.
 */

import { GoogleAPIClient, googleApiClient } from './GoogleAPIClient';

// Export the GoogleAPIClient class and singleton instance
export { GoogleAPIClient, googleApiClient };

// Export a utility function to check if Gmail integration is available
export const isGmailAvailable = async (): Promise<boolean> => {
  await googleApiClient.initialize();
  return googleApiClient.isSignedIn() && !googleApiClient.isUsingMockData();
};

// Export an easy-to-use function to get Gmail API client
export const getGmailClient = async () => {
  await googleApiClient.initialize();
  const token = googleApiClient.getAccessToken();
  
  if (!token || googleApiClient.isUsingMockData()) {
    console.warn('No valid Gmail token available - using mock data');
    return null;
  }
  
  // Import dynamically to avoid server-side rendering issues
  const { google } = await import('googleapis');
  
  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  
  // Return Gmail client
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export default {
  googleApiClient,
  isGmailAvailable,
  getGmailClient
};

// Re-export types
export type { GoogleUserInfo } from './GoogleAPIClient'; 