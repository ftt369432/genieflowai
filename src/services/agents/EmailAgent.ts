import { BaseAgent, AgentAction } from './BaseAgent';
import emailService from '../../services/email/emailService';

// Define AgentActionType enum since it's not exported from BaseAgent
enum AgentActionType {
  GET_EMAIL_FOLDERS = 'GET_EMAIL_FOLDERS',
  GET_EMAIL_MESSAGES = 'GET_EMAIL_MESSAGES',
  GET_EMAIL_MESSAGE = 'GET_EMAIL_MESSAGE',
  GET_EMAIL_ACCOUNTS = 'GET_EMAIL_ACCOUNTS'
}

/**
 * EmailAgent class for handling email-related actions
 */
export class EmailAgent extends BaseAgent {
  constructor() {
    super({ type: 'email' }); // Pass an object that satisfies Partial<AgentConfig>
  }

  /**
   * Implement the abstract train method from BaseAgent
   */
  async train(): Promise<void> {
    // Implement training logic if needed
    console.log('Training EmailAgent...');
  }

  /**
   * Perform email-related actions
   */
  async performAction(action: AgentAction): Promise<any> {
    const startTime = Date.now();
    const { type, params } = action;

    try {
      switch (type) {
        case AgentActionType.GET_EMAIL_FOLDERS:
          // EmailService doesn't have a getFolders method, so we'll return a basic set
          return {
            folders: ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM'],
            duration: Date.now() - startTime // Simple duration calculation
          };
        
        case AgentActionType.GET_EMAIL_MESSAGES:
          return {
            messages: await this.getMessages(params),
            duration: Date.now() - startTime
          };
        
        case AgentActionType.GET_EMAIL_MESSAGE:
          return {
            message: await this.getMessage(params?.id),
            duration: Date.now() - startTime
          };
        
        case AgentActionType.GET_EMAIL_ACCOUNTS:
          return {
            accounts: await this.getAccounts(),
            duration: Date.now() - startTime
          };
        
        default:
          throw new Error(`Unsupported email action type: ${type}`);
      }
    } catch (error: any) {
      console.error(`EmailAgent error for action ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get email accounts
   */
  private async getAccounts() {
    try {
      return await emailService.getAccounts();
    } catch (error) {
      console.error('Failed to get email accounts:', error);
      throw error;
    }
  }

  /**
   * Get email messages with optional filtering
   */
  private async getMessages(params: any = {}) {
    try {
      const { folderId = 'INBOX', query, maxResults = 20, pageToken } = params;
      
      // Map folder ID to label IDs for Gmail
      const labelIds = [folderId]; // In a real app, you might have a more complex mapping
      
      const response = await emailService.getEmails({
        labelIds,
        q: query,
        maxResults,
        pageToken
      });
      
      return {
        messages: response.messages,
        nextPageToken: response.nextPageToken,
        resultSizeEstimate: response.resultSizeEstimate
      };
    } catch (error) {
      console.error('Failed to get email messages:', error);
      throw error;
    }
  }

  /**
   * Get a single email message by ID
   */
  private async getMessage(id: string): Promise<any> {
    if (!id) {
      throw new Error('Email ID is required');
    }

    try {
      // Return as any to avoid type mismatch between different EmailMessage interfaces
      return await emailService.getEmail(id);
    } catch (error) {
      console.error(`Failed to get email message ${id}:`, error);
      throw error;
    }
  }
}