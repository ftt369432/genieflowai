// Re-export the EmailService class and singleton
import { EmailService, emailService } from './EmailService';
import type { EmailMessage } from './EmailService';

// Re-export the IMAPService
import { IMAPService } from './IMAPService';

// Re-export email-related types from types/email.ts
import type {
  EmailAccount,
  EmailFolder,
  EmailAttachment,
  EmailDraft,
  EmailLabel,
  EmailFilter,
  EmailSignature,
  EmailPreferences,
  EmailAnalysis,
  EmailTemplate,
  EmailAnalytics,
  Credentials
} from '../../types/email';

// Export everything
export {
  // Services
  EmailService,
  emailService,
  IMAPService,
};

// Export types
export type {
  EmailMessage,
  EmailAccount,
  EmailFolder,
  EmailAttachment,
  EmailDraft,
  EmailLabel,
  EmailFilter,
  EmailSignature,
  EmailPreferences,
  EmailAnalysis,
  EmailTemplate,
  EmailAnalytics,
  Credentials
};

// Re-export other types and utilities
export * from './types';
export * from './emailActions';
export * from './emailConfig'; 