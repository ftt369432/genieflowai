/**
 * Setup Email Token
 * 
 * This utility sets up the Gmail API token from the provided 
 * token data object for testing purposes.
 */

import { GoogleAPIClient } from '../google/GoogleAPIClient';
import emailService from './emailService';

/**
 * Sets up Gmail API token for testing
 * @param tokenData The token data object containing provider_token, access_token, etc.
 */
export async function setupGmailAPIToken(tokenData: any): Promise<void> {
  try {
    console.log('Setting up Gmail API token for testing');
    
    // Initialize email service
    await emailService.initialize();
    
    // Get Google API client
    const googleClient = GoogleAPIClient.getInstance();
    
    // Set the provider token
    if (tokenData.provider_token) {
      googleClient.setAccessToken(tokenData.provider_token);
      console.log('Set provider token successfully');
    } else if (tokenData.access_token) {
      googleClient.setAccessToken(tokenData.access_token);
      console.log('Set access token successfully');
    } else {
      console.error('No valid token found in token data');
    }
    
    return;
  } catch (error) {
    console.error('Error setting up Gmail API token:', error);
    throw error;
  }
}

/**
 * Sets up Gmail API with label data for testing
 * @param data The data object containing Gmail labels
 */
export async function setupGmailLabels(data: Record<string, string>): Promise<void> {
  console.log('Available Gmail labels:', Object.keys(data));
  // This function could be extended to store these labels for use in the app
  return;
} 