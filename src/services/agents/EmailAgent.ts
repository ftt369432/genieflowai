import { BaseAgent, AgentAction, AgentActionResult } from './BaseAgent';
import { EmailAccount, EmailFolder, EmailMessage, EmailDraft } from '../email/types';
import { v4 as uuidv4 } from 'uuid';

export class EmailAgent extends BaseAgent {
  private mockAccounts: EmailAccount[] = [];
  private mockFolders: Map<string, EmailFolder[]> = new Map();
  private mockMessages: Map<string, Map<string, EmailMessage[]>> = new Map(); // accountId -> folderId -> messages
  private mockDrafts: Map<string, EmailDraft[]> = new Map();

  constructor(config?: Partial<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>) {
    super({
      id: config?.id || 'email-agent',
      name: config?.name || 'Email Assistant',
      description: config?.description || 'Manages email communications and helps organize your inbox',
      capabilities: [
        'send_email',
        'read_email',
        'search_emails',
        'manage_folders',
        'draft_emails',
        'analyze_emails'
      ],
      type: config?.type || 'email',
      version: '1.0.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    });

    // Initialize some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create a mock account
    const mockAccount: EmailAccount = {
      id: 'mock-account',
      provider: 'google',
      email: 'user@example.com',
      name: 'Mock User',
      connected: true,
      lastSynced: new Date()
    };
    this.mockAccounts.push(mockAccount);

    // Create mock folders
    const mockFolders: EmailFolder[] = [
      { id: 'inbox', name: 'Inbox', type: 'inbox', unreadCount: 3 },
      { id: 'sent', name: 'Sent', type: 'sent', unreadCount: 0 },
      { id: 'drafts', name: 'Drafts', type: 'drafts', unreadCount: 1 },
      { id: 'trash', name: 'Trash', type: 'trash', unreadCount: 0 },
      { id: 'spam', name: 'Spam', type: 'spam', unreadCount: 4 },
      { id: 'important', name: 'Important', type: 'custom', unreadCount: 2 }
    ];
    this.mockFolders.set(mockAccount.id, mockFolders);

    // Create mock messages for inbox
    const inboxMessages = new Map<string, EmailMessage[]>();
    inboxMessages.set('inbox', [
      {
        id: uuidv4(),
        threadId: 't1',
        accountId: mockAccount.id,
        folderId: 'inbox',
        subject: 'Welcome to GenieFlow AI',
        from: 'support@genieflowai.com',
        to: ['user@example.com'],
        body: 'Thank you for joining GenieFlow AI. We are excited to have you on board!',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: false,
        starred: true,
        labels: ['important']
      },
      {
        id: uuidv4(),
        threadId: 't2',
        accountId: mockAccount.id,
        folderId: 'inbox',
        subject: 'Your subscription',
        from: 'billing@genieflowai.com',
        to: ['user@example.com'],
        body: 'Your subscription has been processed successfully.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        starred: false,
        labels: []
      }
    ]);
    this.mockMessages.set(mockAccount.id, inboxMessages);

    // Create mock drafts
    this.mockDrafts.set(mockAccount.id, [
      {
        id: uuidv4(),
        accountId: mockAccount.id,
        subject: 'Draft email',
        to: ['recipient@example.com'],
        body: 'This is a draft email that I started writing...',
        lastModified: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]);
  }

  public getId(): string {
    return this.config.id;
  }

  /**
   * Public method for testing agent capabilities (to be used in initialization/setup stages only)
   */
  public testAgentAction(actionType: string, params: any): Promise<AgentActionResult> {
    console.log(`EmailAgent executing action: ${actionType}`, params);
    return this.executeAction({
      type: actionType,
      params: params
    });
  }

  /**
   * Execute an action on the email agent
   */
  public async executeAction(action: AgentAction): Promise<AgentActionResult> {
    console.log(`EmailAgent executing action: ${action.type}`, action.params);
    const startTime = Date.now();

    try {
      let result: any;

      switch (action.type) {
        case 'get_accounts':
          result = await this.getAccounts();
          break;
        case 'get_folders':
          result = await this.getFolders(action.params.accountId);
          break;
        case 'get_messages':
          result = await this.getMessages(
            action.params.accountId,
            action.params.folderId,
            action.params.options
          );
          break;
        case 'get_message':
          result = await this.getMessage(action.params.accountId, action.params.messageId);
          break;
        case 'send_email':
          result = await this.sendEmail(action.params.accountId, action.params.draft);
          break;
        case 'create_draft':
          result = await this.createDraft(action.params.accountId, action.params.draft);
          break;
        case 'update_draft':
          result = await this.updateDraft(
            action.params.accountId,
            action.params.draftId,
            action.params.changes
          );
          break;
        case 'analyze_emails':
          result = await this.analyzeEmails(action.params.messages);
          break;
        case 'search_emails':
          result = await this.searchEmails(
            action.params.accountId,
            action.params.query,
            action.params.options
          );
          break;
        case 'summarize_thread':
          result = await this.summarizeThread(action.params.messages);
          break;
        case 'suggest_reply':
          result = await this.suggestReply(action.params.message);
          break;
        case 'manageFolders':
          result = await this.manageFolders(action.params);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        success: true,
        action: action,
        data: result,
        timestamp: new Date(),
        message: `Successfully executed ${action.type}`
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`Error executing ${action.type}:`, error);

      return {
        success: false,
        action: action,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Train the email agent with example data
   */
  public async train(trainingData: any[]): Promise<void> {
    console.log('Training EmailAgent with data:', trainingData);
    // Implementation would train the model on sample emails
    // Mock implementation for now
    return Promise.resolve();
  }

  // Mock email service methods

  /**
   * Get all email accounts
   */
  public async getAccounts(): Promise<EmailAccount[]> {
    return this.mockAccounts;
  }

  /**
   * Get folders for an account
   */
  public async getFolders(accountId: string): Promise<EmailFolder[]> {
    return this.mockFolders.get(accountId) || [];
  }

  /**
   * Get messages from a folder
   */
  public async getMessages(
    accountId: string,
    folderId: string,
    options?: { 
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      sortBy?: 'date' | 'sender' | 'subject';
      sortDirection?: 'asc' | 'desc';
    }
  ): Promise<EmailMessage[]> {
    const folderMessages = this.mockMessages.get(accountId)?.get(folderId) || [];
    
    // Apply filtering options
    let filteredMessages = [...folderMessages];
    
    if (options?.unreadOnly) {
      filteredMessages = filteredMessages.filter(msg => !msg.read);
    }
    
    // Apply sorting
    if (options?.sortBy) {
      filteredMessages.sort((a, b) => {
        let comparison = 0;
        
        switch (options.sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'sender':
            comparison = a.from.localeCompare(b.from);
            break;
          case 'subject':
            comparison = a.subject.localeCompare(b.subject);
            break;
        }
        
        return options.sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply limit and offset
    const start = options?.offset || 0;
    const end = options?.limit ? start + options.limit : undefined;
    
    return filteredMessages.slice(start, end);
  }

  /**
   * Get a specific email message
   */
  public async getMessage(accountId: string, messageId: string): Promise<EmailMessage> {
    const accountFolders = this.mockMessages.get(accountId);
    if (!accountFolders) {
      throw new Error(`Account ${accountId} not found`);
    }
    
    for (const messages of accountFolders.values()) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        return message;
      }
    }
    
    throw new Error(`Message ${messageId} not found`);
  }

  /**
   * Send an email
   */
  public async sendEmail(accountId: string, draft: EmailDraft): Promise<{ success: boolean; messageId?: string }> {
    console.log(`Sending email from ${accountId}: ${JSON.stringify(draft)}`);
    
    // Simulate sending email
    const messageId = `sent-${uuidv4()}`;
    
    return {
      success: true,
      messageId
    };
  }

  /**
   * Create a draft email
   */
  public async createDraft(accountId: string, draft: Partial<EmailDraft>): Promise<EmailDraft> {
    const newDraft: EmailDraft = {
      id: uuidv4(),
      accountId: accountId,
      subject: draft.subject || '',
      to: draft.to || [],
      cc: draft.cc || [],
      bcc: draft.bcc || [],
      body: draft.body || '',
      lastModified: new Date()
    };
    
    const accountDrafts = this.mockDrafts.get(accountId) || [];
    accountDrafts.push(newDraft);
    this.mockDrafts.set(accountId, accountDrafts);
    
    return newDraft;
  }

  /**
   * Update a draft email
   */
  public async updateDraft(
    accountId: string,
    draftId: string,
    changes: Partial<EmailDraft>
  ): Promise<EmailDraft> {
    const accountDrafts = this.mockDrafts.get(accountId) || [];
    const draftIndex = accountDrafts.findIndex(d => d.id === draftId);
    
    if (draftIndex === -1) {
      throw new Error(`Draft ${draftId} not found`);
    }
    
    const updatedDraft = {
      ...accountDrafts[draftIndex],
      ...changes,
      lastModified: new Date()
    };
    
    accountDrafts[draftIndex] = updatedDraft;
    this.mockDrafts.set(accountId, accountDrafts);
    
    return updatedDraft;
  }

  /**
   * Analyze emails for insights
   */
  public async analyzeEmails(messages: EmailMessage[]): Promise<{
    topics: string[];
    senders: { email: string; frequency: number }[];
    sentimentScore: number;
    urgentMessages: string[];
  }> {
    // This would use AI to analyze emails
    // Mock implementation for now
    console.log(`Analyzing ${messages.length} emails`);

    return {
      topics: ['Work', 'Project Updates', 'Meetings'],
      senders: [
        { email: 'manager@example.com', frequency: 5 },
        { email: 'team@example.com', frequency: 3 }
      ],
      sentimentScore: 0.7,
      urgentMessages: messages
        .filter(m => m.subject?.toLowerCase().includes('urgent'))
        .map(m => m.id)
    };
  }

  /**
   * Search emails
   */
  public async searchEmails(
    accountId: string,
    query: string,
    options?: { 
      limit?: number;
      offset?: number;
      folders?: string[];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<EmailMessage[]> {
    const accountFolders = this.mockMessages.get(accountId);
    if (!accountFolders) {
      return [];
    }
    
    const allMessages: EmailMessage[] = [];
    const targetFolders = options?.folders || Array.from(accountFolders.keys());
    
    for (const folderId of targetFolders) {
      const folderMessages = accountFolders.get(folderId) || [];
      allMessages.push(...folderMessages);
    }
    
    // Filter by search query
    const filteredMessages = allMessages.filter(msg => 
      msg.subject.toLowerCase().includes(query.toLowerCase()) ||
      msg.body.toLowerCase().includes(query.toLowerCase()) ||
      msg.from.toLowerCase().includes(query.toLowerCase()) ||
      msg.to.some(r => r.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Apply date filters
    const dateFilteredMessages = filteredMessages.filter(msg => {
      const messageDate = new Date(msg.date);
      if (options?.dateFrom && messageDate < options.dateFrom) {
        return false;
      }
      if (options?.dateTo && messageDate > options.dateTo) {
        return false;
      }
      return true;
    });
    
    // Apply pagination
    const start = options?.offset || 0;
    const end = options?.limit ? start + options.limit : undefined;
    
    return dateFilteredMessages.slice(start, end);
  }

  /**
   * Summarize an email thread
   */
  public async summarizeThread(messages: EmailMessage[]): Promise<{
    summary: string;
    keyPoints: string[];
    participants: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  }> {
    // This would use AI to summarize email threads
    // Mock implementation for now
    console.log(`Summarizing thread with ${messages.length} messages`);
    
    const participants = new Set<string>();
    messages.forEach(m => {
      if (m.from) participants.add(m.from);
      if (m.to) m.to.forEach(recipient => participants.add(recipient));
    });

    return {
      summary: 'This thread discusses project updates and next steps.',
      keyPoints: [
        'Deadline extended to next Friday',
        'New requirements added to the project scope',
        'Team meeting scheduled for Wednesday'
      ],
      participants: Array.from(participants),
      sentiment: 'neutral'
    };
  }

  /**
   * Suggest a reply to an email
   */
  public async suggestReply(message: EmailMessage): Promise<{
    subject: string;
    body: string;
    sentiment: 'formal' | 'casual' | 'friendly';
  }> {
    // This would use AI to generate suggested replies
    // Mock implementation for now
    console.log('Generating reply suggestion for email:', message.id);
    
    const isWorkRelated = message.subject?.toLowerCase().includes('work') || 
                          message.subject?.toLowerCase().includes('project');

    return {
      subject: `Re: ${message.subject}`,
      body: isWorkRelated
        ? 'Thank you for your email. I will review the information you provided and get back to you soon with my thoughts on this matter.'
        : 'Thanks for reaching out! I appreciate you thinking of me. Let me know when would be a good time to connect.',
      sentiment: isWorkRelated ? 'formal' : 'friendly'
    };
  }

  /**
   * Manage email folders
   */
  private async manageFolders(params: any): Promise<any> {
    const { accountId, action } = params;
    
    try {
      switch (action) {
        case 'list':
    return {
            folders: [
              { id: 'inbox', name: 'Inbox', unreadCount: 12 },
              { id: 'sent', name: 'Sent', unreadCount: 0 },
              { id: 'drafts', name: 'Drafts', unreadCount: 3 },
              { id: 'trash', name: 'Trash', unreadCount: 0 },
              { id: 'spam', name: 'Spam', unreadCount: 7 }
            ]
          };
        case 'create':
          return { success: true, folderId: `folder-${Date.now()}` };
        case 'rename':
          return { success: true };
        case 'delete':
          return { success: true };
        default:
          throw new Error(`Unknown folder action: ${action}`);
      }
    } catch (error) {
      console.error(`Error managing folders: ${error}`);
      throw error;
    }
  }
} 