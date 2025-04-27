/**
 * This file is a wrapper around the googleAuth service to maintain
 * backward compatibility with code that imports from this path.
 */

import googleAuthService from './auth/googleAuth';

export default googleAuthService;

/**
 * Convenience function to get the Google auth instance 
 */
export const getGoogleAuthInstance = (): any => {
  return googleAuthService.getInstance();
};

/**
 * Re-export types from the main auth service
 */
export type { GoogleAuthConfig, GoogleAuthError } from './auth/googleAuth'; 