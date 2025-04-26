/**
 * Authentication Service Index
 * 
 * This file consolidates all authentication-related functionality into a single API.
 * It re-exports authentication methods from different providers (Supabase, Google)
 * to provide a unified interface for authentication throughout the application.
 */

// Import from main auth service
import {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthError,
  AUTH_ERROR_CODES
} from './authService';

// Import from Google auth service
import googleAuthService from './googleAuth';

/**
 * Auth service API that consolidates all authentication methods
 */
const auth = {
  // Core authentication
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  
  // Google auth
  google: googleAuthService,
  
  // Error codes
  errorCodes: AUTH_ERROR_CODES
};

// Export default consolidated API
export default auth;

// Export individual functions and types
export {
  // Core authentication functions
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  
  // Google-specific auth
  googleAuthService,
  
  // Error codes
  AUTH_ERROR_CODES
};

// Export types
export type { LoginCredentials, RegisterData, AuthResponse, AuthError }; 