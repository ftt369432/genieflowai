/**
 * Email Service Module
 * 
 * Exports the EmailService class and creates a default instance
 */

// Import the service class
import { EmailService } from './EmailService';

// Import types from the types file
import type { 
  EmailMessage,
  EmailFolder,
  EmailLabel,
  EmailAccount,
  EmailFilter,
  EmailQuery,
  IMAPConfig,
  EmailPreferences
} from './types';

// Create a singleton instance for backward compatibility
const emailService = new EmailService();

// Re-export types
export type { 
  EmailMessage,
  EmailFolder,
  EmailLabel,
  EmailAccount,
  EmailFilter,
  EmailQuery,
  IMAPConfig,
  EmailPreferences
};

// Export the service class and the singleton instance
export { EmailService, emailService };

// Default export for convenience
export default emailService; 