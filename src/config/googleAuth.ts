/**
 * Google OAuth Configuration
 * 
 * Centralized configuration for Google OAuth settings to ensure
 * consistent scopes and settings across different parts of the application.
 */

// Required OAuth scopes for Gmail access
export const GMAIL_SCOPES = [
  'email',
  'profile',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'
];

// Required OAuth scopes for Google Calendar access
export const CALENDAR_SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Combine all required scopes for comprehensive access
export const ALL_SCOPES = Array.from(new Set([
  ...GMAIL_SCOPES,
  ...CALENDAR_SCOPES
]));

// Google OAuth configuration for different environments
export const getGoogleOAuthConfig = (environment = process.env.NODE_ENV) => {
  const isDevelopment = environment !== 'production';
  
  // Base OAuth configuration
  const config = {
    scopes: ALL_SCOPES,
    accessType: 'offline',
    prompt: 'consent',
    includeGrantedScopes: true
  };
  
  // Add environment-specific settings
  if (isDevelopment) {
    // For local development
    return {
      ...config,
      redirectUri: window?.location?.origin 
        ? `${window.location.origin}/auth/callback` 
        : 'http://localhost:3000/auth/callback'
    };
  } else {
    // For production
    return {
      ...config,
      redirectUri: 'https://genieflowai.netlify.app/auth/callback'
    };
  }
};

// Helper function to generate the authorization URL
export const getAuthUrl = (additionalScopes: string[] = []) => {
  const config = getGoogleOAuthConfig();
  const scopes = Array.from(new Set([...config.scopes, ...additionalScopes]));
  
  // In a real implementation, this would generate the actual OAuth URL
  // For now, we just return a configuration object that can be used by other services
  return {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: config.redirectUri,
    scopes: scopes.join(' '),
    accessType: config.accessType,
    prompt: config.prompt,
    includeGrantedScopes: config.includeGrantedScopes
  };
}; 