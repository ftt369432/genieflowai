/**
 * Email Service Module
 * 
 * Exports the EmailService class and creates a default instance
 */

// Import the service class and instance from the refactored implementation
import emailService, { EmailMessage, EmailOptions, EmailResponse } from './emailService';

// Create a reference to the EmailService class
const EmailService = emailService.constructor as any;

// Export the EmailService class
export { EmailService };

// Export types from the refactored service
export type { 
  EmailMessage,
  EmailOptions,
  EmailResponse
};

// Re-export the types from the original EmailService for backward compatibility
export type {
  EmailFolder,
  EmailLabel,
  EmailAccount,
  EmailFilter,
  EmailQuery,
  IMAPConfig,
  EmailPreferences,
  EmailAnalysis,
} from './types';

// Export the singleton instance
export { emailService };

// Default export for convenience
export default emailService; 