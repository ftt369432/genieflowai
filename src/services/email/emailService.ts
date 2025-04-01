/**
 * EmailService.ts - Mock Implementation
 * 
 * This is a simplified mock implementation that doesn't depend on 
 * external APIs or environment variables.
 */

import { 
  EmailAccount, 
  EmailFolder, 
  EmailMessage, 
  EmailLabel, 
  EmailFilter,
  EmailQuery,
  IMAPConfig
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { mockEmails, mockFolders, mockLabels, mockAccounts } from './mockData';
import { getEnv } from '../../config/env';
import { googleAuthService } from '../auth/googleAuth';

// Types for intelligent email processing
export interface EmailAnalysis {
  summary: string;
  actionItems: string[];
  meetingDetails?: {
    date?: string;
    time?: string;
    duration?: string;
    attendees?: string[];
    location?: string;
    videoLink?: string;
  };
  sentimentScore?: number; // -1 (negative) to 1 (positive)
  priority: 'high' | 'medium' | 'low';
  category: 'personal' | 'work' | 'promotional' | 'update' | 'social' | 'other';
  isReplyRequired: boolean;
  suggestedReply?: string;
}

// Mock data
const mockEmails: EmailMessage[] = [
  {
    id: 'msg1',
    threadId: 'thread1',
    subject: 'Welcome to GenieFlow',
    from: 'support@genieflow.com',
    to: 'user@example.com',
    body: '<p>Thank you for using GenieFlow! We hope you enjoy our product.</p>',
    snippet: 'Thank you for using GenieFlow! We hope you enjoy our product.',
    labels: ['INBOX', 'CATEGORY_UPDATES'],
    read: false,
    starred: false,
    date: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg2',
    threadId: 'thread2',
    subject: 'Meeting tomorrow',
    from: 'manager@company.com',
    to: 'user@example.com',
    body: '<p>Hi there,</p><p>Just a reminder about our team meeting tomorrow at 10 AM.</p><p>Best,<br>Manager</p>',
    snippet: 'Hi there, Just a reminder about our team meeting tomorrow at 10 AM.',
    labels: ['INBOX', 'CATEGORY_PERSONAL', 'Label_1'],
    read: true,
    starred: true,
    date: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'msg3',
    threadId: 'thread3',
    subject: 'Your subscription',
    from: 'billing@service.com',
    to: 'user@example.com',
    body: '<p>Your subscription has been renewed for another month.</p>',
    snippet: 'Your subscription has been renewed for another month.',
    labels: ['INBOX', 'CATEGORY_UPDATES'],
    read: true,
    starred: false,
    date: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'msg4',
    threadId: 'thread4',
    subject: 'Weekend plans',
    from: 'friend@personal.com',
    to: 'user@example.com',
    body: '<p>Hey! Are you free this weekend? We\'re planning to go hiking.</p>',
    snippet: 'Hey! Are you free this weekend? We\'re planning to go hiking.',
    labels: ['INBOX', 'CATEGORY_PERSONAL', 'Label_2'],
    read: false,
    starred: true,
    date: new Date(Date.now() - 259200000).toISOString()
  }
];

const mockFolders: EmailFolder[] = [
  { id: 'INBOX', name: 'Inbox', type: 'system', unreadCount: 2, totalCount: 4 },
  { id: 'SENT', name: 'Sent', type: 'system', unreadCount: 0, totalCount: 20 },
  { id: 'DRAFT', name: 'Drafts', type: 'system', unreadCount: 0, totalCount: 3 },
  { id: 'TRASH', name: 'Trash', type: 'system', unreadCount: 0, totalCount: 10 },
  { id: 'SPAM', name: 'Spam', type: 'system', unreadCount: 0, totalCount: 5 }
];

const mockLabels: EmailLabel[] = [
  { id: 'CATEGORY_PERSONAL', name: 'Personal', type: 'system' },
  { id: 'CATEGORY_SOCIAL', name: 'Social', type: 'system' },
  { id: 'CATEGORY_UPDATES', name: 'Updates', type: 'system' },
  { id: 'CATEGORY_PROMOTIONS', name: 'Promotions', type: 'system' },
  { id: 'Label_1', name: 'Work', type: 'user', color: { backgroundColor: '#4285F4' } },
  { id: 'Label_2', name: 'Family', type: 'user', color: { backgroundColor: '#0F9D58' } }
];

const mockAccounts: EmailAccount[] = [
  {
    id: 'account1',
    email: 'user@gmail.com',
    name: 'My Gmail',
    provider: 'gmail',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Email Service Class
 */
export class EmailService {
  private mockEmails: EmailMessage[] = [...mockEmails];
  private mockFolders: EmailFolder[] = [...mockFolders];
  private mockLabels: EmailLabel[] = [...mockLabels];
  private mockAccounts: EmailAccount[] = [...mockAccounts];
  private isAuthenticated: boolean = false;
  private userId: string | null = null;
  
  constructor() {
    this.loadAccountsFromLocalStorage();
    
    const { useMock } = getEnv();
    console.log(`EmailService initialized in ${useMock ? 'mock' : 'production'} mode`);
    
    // Try to initialize Google Auth if in production mode
    if (!useMock) {
      this.initializeGoogleAuth();
    }
  }
  
  /**
   * Initialize Google Auth
   */
  private async initializeGoogleAuth(): Promise<void> {
    try {
      await googleAuthService.initialize();
      console.log('Google Auth service initialized');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
    }
  }
  
  /**
   * Load accounts from local storage if available
   */
  private loadAccountsFromLocalStorage(): void {
    try {
      const storedAccounts = localStorage.getItem('email_accounts');
      if (storedAccounts) {
        this.mockAccounts = JSON.parse(storedAccounts);
      }
    } catch (error) {
      console.error('Failed to load accounts from local storage:', error);
    }
  }
  
  /**
   * Add a Google account
   */
  public async addGoogleAccount(): Promise<EmailAccount> {
    const { useMock } = getEnv();
    
    // If we're in mock mode, return a mock account
    if (useMock) {
      await this.simulateNetworkDelay();
      
      const newAccount: EmailAccount = {
        id: `gmail-${Date.now()}`,
        email: 'user@gmail.com',
        name: 'Google Account',
        provider: 'gmail',
        isActive: true,
        connected: true,
        lastSynced: new Date(),
        createdAt: new Date().toISOString()
      };
      
      this.mockAccounts.push(newAccount);
      
      // Save to local storage for persistence
      this.saveAccountsToLocalStorage();
      
      return newAccount;
    }
    
    // In production mode, handle real Google OAuth
    try {
      console.log('Initiating Google account connection...');
      
      // Check if already signed in
      if (!googleAuthService.isSignedIn()) {
        console.log('User not signed in to Google, opening auth flow...');
        await googleAuthService.signIn();
      }
      
      // Get access token
      const accessToken = await googleAuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Make a request to get user profile information
      const userInfo = await googleAuthService.request<any>({
        path: 'https://www.googleapis.com/userinfo/v2/me',
        method: 'GET'
      });
      
      if (!userInfo || !userInfo.email) {
        throw new Error('Failed to get user information');
      }
      
      console.log('Successfully connected to Google account:', userInfo.email);
      
      // Create account record
      const newAccount: EmailAccount = {
        id: `gmail-${Date.now()}`,
        email: userInfo.email,
        name: userInfo.name || 'Google Account',
        provider: 'gmail',
        isActive: true,
        connected: true,
        lastSynced: new Date(),
        createdAt: new Date().toISOString(),
        credentials: {
          accessToken,
          provider: 'google'
        }
      };
      
      this.mockAccounts.push(newAccount);
      this.saveAccountsToLocalStorage();
      
      return newAccount;
    } catch (error) {
      console.error('Error connecting Google account:', error);
      throw error;
    }
  }
  
  /**
   * Add an IMAP account
   */
  public async addIMAPAccount(config: IMAPConfig): Promise<EmailAccount> {
    await this.simulateNetworkDelay();
    
    const newAccount: EmailAccount = {
      id: `imap-${Date.now()}`,
      email: config.email,
      name: `${config.provider || 'IMAP'} Account`,
      provider: 'imap',
      isActive: true,
      connected: true,
      lastSynced: new Date(),
      createdAt: new Date().toISOString(),
      imapConfig: {
        host: config.imapHost,
        port: config.imapPort,
        useSSL: config.useSSL
      },
      smtpConfig: {
        host: config.smtpHost,
        port: config.smtpPort,
        useSSL: config.useSSL
      },
      credentials: {
        password: config.password
      }
    };
    
    this.mockAccounts.push(newAccount);
    
    // Save to local storage for persistence
    this.saveAccountsToLocalStorage();
    
    return newAccount;
  }
  
  /**
   * Remove an account
   */
  public async removeAccount(accountId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    this.mockAccounts = this.mockAccounts.filter(account => account.id !== accountId);
    
    // Save to local storage for persistence
    this.saveAccountsToLocalStorage();
  }
  
  /**
   * Get all accounts
   */
  public async getAccounts(): Promise<EmailAccount[]> {
    await this.simulateNetworkDelay();
    return this.mockAccounts;
  }
  
  /**
   * Save accounts to local storage
   */
  private saveAccountsToLocalStorage(): void {
    try {
      localStorage.setItem('email_accounts', JSON.stringify(this.mockAccounts));
    } catch (error) {
      console.error('Failed to save accounts to local storage:', error);
    }
  }
  
  /**
   * Check if user is authorized
   */
  public isAuthorized(): boolean {
    return this.isAuthenticated;
  }
  
  /**
   * Authorize the API client
   */
  public async authorize(): Promise<boolean> {
    await this.simulateNetworkDelay();
    this.isAuthenticated = true;
    return true;
  }
  
  /**
   * Sign out and revoke access
   */
  public async signOut(): Promise<void> {
    await this.simulateNetworkDelay();
    this.isAuthenticated = false;
  }
  
  /**
   * Get folders for an account
   */
  public async getFolders(accountId?: string): Promise<{ folders: EmailFolder[] }> {
    await this.simulateNetworkDelay();
    return { folders: this.mockFolders };
  }
  
  /**
   * Get labels
   */
  public async getLabels(accountId?: string): Promise<{ labels: EmailLabel[] }> {
    await this.simulateNetworkDelay();
    return { labels: this.mockLabels };
  }
  
  /**
   * Get messages by query
   */
  public async getMessages(accountId: string, query: EmailQuery = {}): Promise<{ messages: EmailMessage[] }> {
    await this.simulateNetworkDelay();
    
    let filtered = [...this.mockEmails];
    
    // Filter by folder if provided
    if (query.folderId) {
      filtered = filtered.filter(email => 
        email.labels && email.labels.includes(query.folderId!)
      );
    }
    
    // Filter by label if provided
    if (query.labelId) {
      filtered = filtered.filter(email => 
        email.labels && email.labels.includes(query.labelId!)
      );
    }
    
    // Filter by read status if provided
    if (query.unread !== undefined) {
      filtered = filtered.filter(email => 
        (email.read === !query.unread)
      );
    }
    
    // Filter by starred status if provided
    if (query.starred !== undefined) {
      filtered = filtered.filter(email => 
        (email.starred === query.starred)
      );
    }
    
    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { messages: filtered };
  }
  
  /**
   * Get a specific message by ID
   */
  public async getMessage(accountId: string, messageId: string): Promise<{ message: EmailMessage }> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    return { message };
  }
  
  /**
   * Mark message as read/unread
   */
  public async markAsRead(accountId: string, messageId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (message) {
      message.read = true;
    }
  }
  
  /**
   * Mark message as unread
   */
  public async markAsUnread(accountId: string, messageId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (message) {
      message.read = false;
    }
  }
  
  /**
   * Move message to folder
   */
  public async moveToFolder(accountId: string, messageId: string, folderId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    if (!message.labels) {
      message.labels = [];
    }
    
    // Remove other folder labels (INBOX, SENT, DRAFT, etc.)
    const folderLabels = ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM'];
    message.labels = message.labels.filter(label => !folderLabels.includes(label));
    
    // Add the new folder label
    message.labels.push(folderId);
  }
  
  /**
   * Apply label to message
   */
  public async applyLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    if (!message.labels) {
      message.labels = [];
    }
    
    // Add the label if it doesn't already exist
    if (!message.labels.includes(labelId)) {
      message.labels.push(labelId);
    }
  }
  
  /**
   * Remove label from message
   */
  public async removeLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const message = this.mockEmails.find(msg => msg.id === messageId);
    
    if (!message || !message.labels) {
      return;
    }
    
    // Remove the label
    message.labels = message.labels.filter(label => label !== labelId);
  }
  
  /**
   * Delete message
   */
  public async deleteMessage(accountId: string, messageId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    // Find the message
    const messageIndex = this.mockEmails.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    // Remove from array
    this.mockEmails.splice(messageIndex, 1);
  }
  
  /**
   * Send message
   */
  public async sendMessage(accountId: string, messageData: Partial<EmailMessage>): Promise<void> {
    await this.simulateNetworkDelay();
    
    // Create a new message object
    const newMessage: EmailMessage = {
      id: `msg-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject: messageData.subject || '(no subject)',
      from: messageData.from || 'user@example.com',
      to: messageData.to || 'recipient@example.com',
      body: messageData.body || '',
      cc: messageData.cc,
      bcc: messageData.bcc,
      labels: ['SENT'],
      read: true,
      starred: false,
      date: new Date().toISOString()
    };
    
    // Add to mock emails
    this.mockEmails.unshift(newMessage);
  }
  
  /**
   * Save draft
   */
  public async saveDraft(accountId: string, draft: Partial<EmailMessage>): Promise<{ message: EmailMessage }> {
    await this.simulateNetworkDelay();
    
    // Create a new draft message
    const newDraft: EmailMessage = {
      id: draft.id || `draft-${Date.now()}`,
      threadId: draft.threadId || `thread-${Date.now()}`,
      subject: draft.subject || '(no subject)',
      from: draft.from || 'user@example.com',
      to: draft.to || '',
      body: draft.body || '',
      cc: draft.cc || [],
      bcc: draft.bcc || [],
      labels: ['DRAFT'],
      read: true,
      starred: false,
      date: new Date().toISOString()
    };
    
    // If this is an update to an existing draft, remove the old one
    if (draft.id) {
      const index = this.mockEmails.findIndex(msg => msg.id === draft.id);
      if (index !== -1) {
        this.mockEmails.splice(index, 1);
      }
    }
    
    // Add to mock emails
    this.mockEmails.unshift(newDraft);
    
    return { message: newDraft };
  }
  
  /**
   * Refresh account data
   */
  public async refreshAccount(accountId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const account = this.mockAccounts.find(acc => acc.id === accountId);
    
    if (account) {
      account.lastSynced = new Date();
    }
  }
  
  /**
   * Helper to simulate network delay
   */
  private async simulateNetworkDelay(min: number = 200, max: number = 600): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Analyze email content for intelligent processing
   * Extracts tasks, meetings, sentiment, and suggested replies
   */
  public async analyzeEmail(accountId: string, messageId: string): Promise<EmailAnalysis> {
    await this.simulateNetworkDelay();
    
    const { message } = await this.getMessage(accountId, messageId);
    
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    // For mock implementation, create intelligent analysis based on content patterns
    const analysis: EmailAnalysis = {
      summary: this.generateSummary(message),
      actionItems: this.extractActionItems(message),
      priority: this.determinePriority(message),
      category: this.determineCategory(message),
      isReplyRequired: this.isReplyNeeded(message),
      sentimentScore: this.analyzeTextSentiment(message)
    };
    
    // Extract meeting details if this appears to be a meeting invitation
    if (this.isMeetingInvitation(message)) {
      analysis.meetingDetails = this.extractMeetingDetails(message);
    }
    
    // Generate a suggested reply if needed
    if (analysis.isReplyRequired) {
      analysis.suggestedReply = this.generateReplyTemplate(message, analysis);
    }
    
    return analysis;
  }
  
  /**
   * Generate a summary of the email content
   */
  private generateSummary(message: EmailMessage): string {
    // Simple implementation - in a real system this would use NLP
    const text = this.extractTextFromBody(message.body || '');
    const firstSentence = text.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
    
    if (text.length <= 100) {
      return text;
    }
    
    return `${firstSentence.trim()}. This email${message.subject?.includes('meeting') ? ' discusses a meeting' : 
      message.subject?.includes('task') ? ' mentions tasks' : 
      message.subject?.includes('update') ? ' provides updates' : 
      ''}.`;
  }
  
  /**
   * Extract action items from email content
   */
  private extractActionItems(message: EmailMessage): string[] {
    const actionItems: string[] = [];
    const text = this.extractTextFromBody(message.body || '');
    
    // Look for patterns that might indicate action items
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Match patterns like "Please do X" or "Action item: X" or "TODO: X"
      if (
        line.match(/(please|kindly)\s+(do|complete|finish|review|send|check)/i) ||
        line.match(/(action item|task|todo|to-do|to do):/i) ||
        line.match(/^(-|\*|\d+\.)\s+.+/) // Bullet or numbered items
      ) {
        actionItems.push(line.trim());
      }
    }
    
    // For mock implementation, if we don't find any, but content suggests tasks
    if (actionItems.length === 0 && (
      message.subject?.toLowerCase().includes('task') || 
      message.subject?.toLowerCase().includes('action') ||
      text.toLowerCase().includes('by tomorrow') ||
      text.toLowerCase().includes('please') ||
      text.toLowerCase().includes('needed')
    )) {
      // Extract a sentence that might be a task
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
      for (const sentence of sentences) {
        if (
          sentence.toLowerCase().includes('please') || 
          sentence.toLowerCase().includes('need') ||
          sentence.toLowerCase().includes('should') ||
          sentence.toLowerCase().includes('could you')
        ) {
          actionItems.push(sentence.trim());
          break;
        }
      }
    }
    
    return actionItems;
  }
  
  /**
   * Determine the priority of an email
   */
  private determinePriority(message: EmailMessage): 'high' | 'medium' | 'low' {
    const subject = message.subject?.toLowerCase() || '';
    const from = message.from?.toLowerCase() || '';
    const body = this.extractTextFromBody(message.body || '').toLowerCase();
    
    // Check for explicit priority indicators
    if (
      subject.includes('urgent') || 
      subject.includes('important') || 
      subject.includes('asap') ||
      subject.includes('critical') ||
      body.includes('urgent') || 
      body.includes('as soon as possible') || 
      body.includes('emergency')
    ) {
      return 'high';
    }
    
    // Check for time sensitivity
    if (
      body.includes('by tomorrow') || 
      body.includes('by today') || 
      body.includes('deadline') ||
      body.includes('due date')
    ) {
      return 'high';
    }
    
    // Check for medium priority indicators
    if (
      // Check if this appears to be from a manager or colleague
      from.includes('manager') || 
      from.includes('director') || 
      from.includes('supervisor') ||
      // Or contains action-oriented language
      body.includes('please review') || 
      body.includes('need your input') || 
      body.includes('please respond')
    ) {
      return 'medium';
    }
    
    // Default to low priority for newsletters, mass emails, etc.
    return 'low';
  }
  
  /**
   * Determine the category of an email
   */
  private determineCategory(message: EmailMessage): 'personal' | 'work' | 'promotional' | 'update' | 'social' | 'other' {
    const subject = message.subject?.toLowerCase() || '';
    const from = message.from?.toLowerCase() || '';
    const body = this.extractTextFromBody(message.body || '').toLowerCase();
    
    // Check for promotional content
    if (
      from.includes('newsletter') || 
      from.includes('no-reply') || 
      from.includes('noreply') ||
      from.includes('marketing') ||
      subject.includes('offer') || 
      subject.includes('sale') || 
      subject.includes('discount') ||
      subject.includes('off') && subject.includes('%')
    ) {
      return 'promotional';
    }
    
    // Check for social content
    if (
      from.includes('facebook') || 
      from.includes('twitter') || 
      from.includes('instagram') ||
      from.includes('linkedin') ||
      subject.includes('invitation') && subject.includes('connect') ||
      subject.includes('friend request') ||
      subject.includes('tagged you')
    ) {
      return 'social';
    }
    
    // Check for update notifications
    if (
      subject.includes('update') || 
      subject.includes('notification') || 
      subject.includes('alert') ||
      from.includes('update') ||
      from.includes('alert') ||
      from.includes('notification')
    ) {
      return 'update';
    }
    
    // Determine if it's personal or work
    // This is a simple heuristic - in real systems this would be more sophisticated
    const workDomains = ['company.com', 'corp', 'ltd', 'inc', 'llc', 'org', 'gov'];
    const isFromWorkDomain = workDomains.some(domain => from.includes(domain));
    const hasWorkTerms = body.includes('meeting') || body.includes('project') || body.includes('report') || body.includes('client');
    
    if (isFromWorkDomain || hasWorkTerms) {
      return 'work';
    }
    
    // Check for personal communications
    const personalTerms = ['hey', 'hi there', 'hello', 'how are you', 'family', 'friend', 'weekend', 'personal'];
    const hasPersonalTerms = personalTerms.some(term => body.includes(term) || subject.includes(term));
    
    if (hasPersonalTerms) {
      return 'personal';
    }
    
    return 'other';
  }
  
  /**
   * Determine if a reply is needed for this email
   */
  private isReplyNeeded(message: EmailMessage): boolean {
    const subject = message.subject?.toLowerCase() || '';
    const body = this.extractTextFromBody(message.body || '').toLowerCase();
    
    // Check for questions
    if (body.includes('?')) {
      return true;
    }
    
    // Check for requests
    if (
      body.includes('please') && 
      (body.includes('let me know') || body.includes('respond') || body.includes('reply'))
    ) {
      return true;
    }
    
    // Check for common phrases requesting a response
    const replyPhrases = [
      'looking forward to hearing from you',
      'let me know what you think',
      'your thoughts',
      'get back to me',
      'what do you think',
      'waiting for your response',
      'confirm receipt'
    ];
    
    for (const phrase of replyPhrases) {
      if (body.includes(phrase)) {
        return true;
      }
    }
    
    // Don't recommend replies for automated emails
    if (
      message.from?.includes('no-reply') ||
      message.from?.includes('noreply') ||
      message.from?.includes('donotreply')
    ) {
      return false;
    }
    
    return false;
  }
  
  /**
   * Analyze text sentiment
   */
  private analyzeTextSentiment(message: EmailMessage): number {
    const text = this.extractTextFromBody(message.body || '').toLowerCase();
    
    // Simple sentiment analysis - in a real system this would use NLP
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic',
      'wonderful', 'happy', 'pleased', 'delighted', 'thanks', 'thank you',
      'appreciate', 'excited', 'love', 'best', 'congratulations'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'upset',
      'unfortunately', 'sorry', 'regret', 'issue', 'problem', 'mistake',
      'error', 'fault', 'wrong', 'failed', 'missed', 'complaint', 'concern'
    ];
    
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of positiveWords) {
      const matches = text.match(new RegExp(`\\b${word}\\b`, 'gi'));
      if (matches) {
        positiveCount += matches.length;
      }
    }
    
    for (const word of negativeWords) {
      const matches = text.match(new RegExp(`\\b${word}\\b`, 'gi'));
      if (matches) {
        negativeCount += matches.length;
      }
    }
    
    const totalWords = text.split(/\s+/).length;
    if (totalWords > 0) {
      score = (positiveCount - negativeCount) / Math.sqrt(positiveCount + negativeCount + 1);
      // Bound between -1 and 1
      score = Math.max(-1, Math.min(1, score));
    }
    
    return score;
  }
  
  /**
   * Check if an email is a meeting invitation
   */
  private isMeetingInvitation(message: EmailMessage): boolean {
    const subject = message.subject?.toLowerCase() || '';
    const body = this.extractTextFromBody(message.body || '').toLowerCase();
    
    // Check for meeting-related keywords
    const meetingTerms = [
      'meeting', 'invite', 'invitation', 'calendar', 'schedule',
      'appointment', 'discussion', 'call', 'conference', 'zoom',
      'teams', 'google meet', 'webex'
    ];
    
    // Check for time/date patterns
    const timePatterns = body.match(/(\d{1,2}:\d{2})/g);
    const datePatterns = body.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g);
    
    if (
      meetingTerms.some(term => subject.includes(term) || body.includes(term)) &&
      (timePatterns || datePatterns)
    ) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extract meeting details from email content
   */
  private extractMeetingDetails(message: EmailMessage): EmailAnalysis['meetingDetails'] {
    const body = this.extractTextFromBody(message.body || '');
    
    // This is a simplified implementation - in real cases we'd use more sophisticated NLP
    const details: EmailAnalysis['meetingDetails'] = {};
    
    // Try to extract date
    const dateMatch = body.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/i);
    if (dateMatch) {
      details.date = dateMatch[0];
    }
    
    // Try to extract time
    const timeMatch = body.match(/\d{1,2}:\d{2} ?(?:am|pm|AM|PM)/);
    if (timeMatch) {
      details.time = timeMatch[0];
    }
    
    // Try to extract meeting link
    const linkMatch = body.match(/https:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)[^\s]*/);
    if (linkMatch) {
      details.videoLink = linkMatch[0];
    }
    
    // Try to extract duration
    const durationMatch = body.match(/\d+ (?:hour|minute|min)s?/);
    if (durationMatch) {
      details.duration = durationMatch[0];
    }
    
    // Try to extract location
    const locationPatterns = [
      /Location: ([^\n]+)/i,
      /Where: ([^\n]+)/i,
      /Place: ([^\n]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        details.location = match[1].trim();
        break;
      }
    }
    
    // Try to extract attendees
    const attendeesMatch = body.match(/Attendees:([^\n]+)/i) || body.match(/Participants:([^\n]+)/i);
    if (attendeesMatch && attendeesMatch[1]) {
      details.attendees = attendeesMatch[1].split(',').map(attendee => attendee.trim());
    }
    
    return details;
  }
  
  /**
   * Generate a reply template based on email analysis
   */
  private generateReplyTemplate(message: EmailMessage, analysis: EmailAnalysis): string {
    const sender = message.from?.split('<')[0].trim() || 'there';
    const firstName = sender.split(' ')[0];
    
    // Base template
    let template = `Hi ${firstName},\n\nThank you for your email. `;
    
    // Add content based on category and sentiment
    if (analysis.category === 'work') {
      if (analysis.sentimentScore && analysis.sentimentScore > 0.3) {
        template += "I appreciate your positive message. ";
      } else if (analysis.sentimentScore && analysis.sentimentScore < -0.3) {
        template += "I understand your concerns and would like to address them. ";
      }
      
      if (analysis.actionItems.length > 0) {
        template += "Regarding the tasks mentioned:\n\n";
        analysis.actionItems.forEach(item => {
          template += `- ${item}\n`;
        });
        template += "\nI'll work on these items and get back to you. ";
      }
      
      if (analysis.meetingDetails) {
        template += `About the meeting ${analysis.meetingDetails.date ? `on ${analysis.meetingDetails.date}` : ''} ${analysis.meetingDetails.time ? `at ${analysis.meetingDetails.time}` : ''}: I `;
        // Randomly choose a response
        const responses = ["can attend", "will be there", "have it on my calendar"];
        template += responses[Math.floor(Math.random() * responses.length)] + ". ";
      }
    } else if (analysis.category === 'personal') {
      template += "It's great to hear from you. ";
      
      if (analysis.sentimentScore && analysis.sentimentScore > 0.3) {
        template += "Thanks for the positive message! ";
      }
    }
    
    // Closing
    template += "\n\nBest regards,\n[Your Name]";
    
    return template;
  }
  
  /**
   * Helper method to extract clean text from HTML or plain text body
   */
  private extractTextFromBody(body: string): string {
    // Simple HTML to text conversion - in a real application, use a proper HTML parser
    if (body.includes('<')) {
      // Replace common HTML tags with newlines or spaces
      return body
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<li[^>]*>/gi, '\n- ')
        .replace(/<\/[^>]*>/gi, '')
        .replace(/<[^>]*>/gi, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return body.trim();
  }
}