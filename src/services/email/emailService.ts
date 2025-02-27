import { GoogleAPIClient } from '../google/GoogleAPIClient';
import { IMAPConfig } from '../../components/email/IMAPConfigForm';
import { EmailAccount, EmailFilter, EmailFolder, EmailDraft, EmailPreferences } from '../../types';
import { IMAPService } from './IMAPService';

// Export the interface first
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  date: Date;
  attachments?: Array<{
    filename: string;
  }>;
  labels?: string[];
  read?: boolean;
  starred?: boolean;
}

// Create a namespace for the email service
export namespace EmailServiceNS {
  export class EmailService {
    private static _instance: EmailService | null = null;
    private googleClient: GoogleAPIClient;
    private accounts: EmailAccount[] = [];
    private imapConfigs = new Map<string, IMAPConfig>();
    private imapServices = new Map<string, IMAPService>();
    private preferences = new Map<string, EmailPreferences>();
    private drafts = new Map<string, EmailDraft[]>();
    private filters = new Map<string, EmailFilter[]>();

    private constructor() {
      this.googleClient = GoogleAPIClient.getInstance();

      // Load stored preferences
      const storedPrefs = localStorage.getItem('email_preferences');
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        Object.entries(prefs).forEach(([accountId, pref]) => {
          this.preferences.set(accountId, pref as EmailPreferences);
        });
      }

      // Load stored drafts
      const storedDrafts = localStorage.getItem('email_drafts');
      if (storedDrafts) {
        const drafts = JSON.parse(storedDrafts);
        Object.entries(drafts).forEach(([accountId, draftList]) => {
          this.drafts.set(accountId, draftList as EmailDraft[]);
        });
      }

      // Load stored filters
      const storedFilters = localStorage.getItem('email_filters');
      if (storedFilters) {
        const filters = JSON.parse(storedFilters);
        Object.entries(filters).forEach(([accountId, filterList]) => {
          this.filters.set(accountId, filterList as EmailFilter[]);
        });
      }
    }

    public static get instance(): EmailService {
      if (!EmailService._instance) {
        EmailService._instance = new EmailService();
      }
      return EmailService._instance;
    }

    private saveStoredData() {
      // Save preferences
      const prefsObj: Record<string, EmailPreferences> = {};
      this.preferences.forEach((pref, accountId) => {
        prefsObj[accountId] = pref;
      });
      localStorage.setItem('email_preferences', JSON.stringify(prefsObj));

      // Save drafts
      const draftsObj: Record<string, EmailDraft[]> = {};
      this.drafts.forEach((draftList, accountId) => {
        draftsObj[accountId] = draftList;
      });
      localStorage.setItem('email_drafts', JSON.stringify(draftsObj));

      // Save filters
      const filtersObj: Record<string, EmailFilter[]> = {};
      this.filters.forEach((filterList, accountId) => {
        filtersObj[accountId] = filterList;
      });
      localStorage.setItem('email_filters', JSON.stringify(filtersObj));
    }

    async addGoogleAccount(): Promise<EmailAccount> {
      await this.googleClient.signIn();
      
      const profile = await this.googleClient.request<any>({
        path: 'gmail/v1/users/me/profile'
      });

      const account: EmailAccount = {
        id: profile.emailAddress,
        type: 'gmail',
        email: profile.emailAddress,
        connected: true
      };

      this.accounts.push(account);

      // Initialize default preferences for the new account
      this.preferences.set(account.id, {
        defaultSignatureId: undefined,
        defaultReplySignatureId: undefined,
        sendAndArchive: false,
        confirmBeforeSending: true,
        defaultFontFamily: 'Arial',
        defaultFontSize: 14,
        defaultComposeFormat: 'rich',
        showSnippets: true,
        autoAdvance: 'newer',
        messageDisplay: 'default',
        inlineImages: true,
        starredPosition: 'left',
        keyboard: { shortcuts: true },
        notifications: {
          desktop: true,
          sound: true,
          browserTab: true,
          priority: 'important'
        },
        vacation: {
          enabled: false,
          respondTo: 'all'
        }
      });

      this.saveStoredData();
      return account;
    }

    async addIMAPAccount(config: IMAPConfig): Promise<EmailAccount> {
      const imapService = new IMAPService();
      await imapService.connect(config);

      this.imapConfigs.set(config.email, config);
      this.imapServices.set(config.email, imapService);

      const account: EmailAccount = {
        id: config.email,
        type: 'imap',
        email: config.email,
        connected: true
      };

      this.accounts.push(account);

      // Initialize default preferences for the new account
      this.preferences.set(account.id, {
        defaultSignatureId: undefined,
        defaultReplySignatureId: undefined,
        sendAndArchive: false,
        confirmBeforeSending: true,
        defaultFontFamily: 'Arial',
        defaultFontSize: 14,
        defaultComposeFormat: 'rich',
        showSnippets: true,
        autoAdvance: 'newer',
        messageDisplay: 'default',
        inlineImages: true,
        starredPosition: 'left',
        keyboard: { shortcuts: true },
        notifications: {
          desktop: true,
          sound: true,
          browserTab: true,
          priority: 'all'
        },
        vacation: {
          enabled: false,
          respondTo: 'all'
        }
      });

      this.saveStoredData();
      return account;
    }

    async removeAccount(accountId: string): Promise<void> {
      const account = this.accounts.find(a => a.id === accountId);
      if (!account) return;

      if (account.type === 'imap') {
        const imapService = this.imapServices.get(accountId);
        if (imapService) {
          await imapService.disconnect();
          this.imapServices.delete(accountId);
        }
        this.imapConfigs.delete(accountId);
      }

      this.accounts = this.accounts.filter(a => a.id !== accountId);
      this.preferences.delete(accountId);
      this.drafts.delete(accountId);
      this.filters.delete(accountId);
      this.saveStoredData();
    }

    async getFolders(accountId: string): Promise<EmailFolder[]> {
      const account = this.accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      if (account.type === 'gmail') {
        return this.getGmailFolders(account);
      } else {
        const imapService = this.imapServices.get(accountId);
        if (!imapService) throw new Error('IMAP service not found');
        return imapService.getFolders();
      }
    }

    async getMessages(accountId: string, options: {
      folder?: string;
      query?: string;
      pageToken?: string;
      maxResults?: number;
    } = {}): Promise<{
      messages: EmailMessage[];
      nextPageToken?: string;
    }> {
      const account = this.accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      if (account.type === 'gmail') {
        return this.getGmailMessages(account, options);
      } else {
        const imapService = this.imapServices.get(accountId);
        if (!imapService) throw new Error('IMAP service not found');
        return imapService.getMessages(options);
      }
    }

    async saveDraft(draft: EmailDraft): Promise<EmailDraft> {
      const accountDrafts = this.drafts.get(draft.accountId) || [];

      if (draft.id) {
        // Update existing draft
        const index = accountDrafts.findIndex(d => d.id === draft.id);
        if (index !== -1) {
          accountDrafts[index] = { ...draft, savedAt: new Date() };
        }
      } else {
        // Create new draft
        const newDraft = {
          ...draft,
          id: crypto.randomUUID(),
          savedAt: new Date()
        };
        accountDrafts.push(newDraft);
        draft = newDraft;
      }

      this.drafts.set(draft.accountId, accountDrafts);
      this.saveStoredData();
      return draft;
    }

    async deleteDraft(accountId: string, draftId: string): Promise<void> {
      const accountDrafts = this.drafts.get(accountId) || [];
      this.drafts.set(accountId, accountDrafts.filter(d => d.id !== draftId));
      this.saveStoredData();
    }

    async getDrafts(accountId: string): Promise<EmailDraft[]> {
      return this.drafts.get(accountId) || [];
    }

    async saveFilter(accountId: string, filter: EmailFilter): Promise<EmailFilter> {
      const accountFilters = this.filters.get(accountId) || [];

      if (filter.id) {
        // Update existing filter
        const index = accountFilters.findIndex(f => f.id === filter.id);
        if (index !== -1) {
          accountFilters[index] = filter;
        }
      } else {
        // Create new filter
        filter.id = crypto.randomUUID();
        accountFilters.push(filter);
      }

      this.filters.set(accountId, accountFilters);
      this.saveStoredData();
      return filter;
    }

    async deleteFilter(accountId: string, filterId: string): Promise<void> {
      const accountFilters = this.filters.get(accountId) || [];
      this.filters.set(accountId, accountFilters.filter(f => f.id !== filterId));
      this.saveStoredData();
    }

    async getFilters(accountId: string): Promise<EmailFilter[]> {
      return this.filters.get(accountId) || [];
    }

    async updatePreferences(accountId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
      const currentPrefs = this.preferences.get(accountId);
      if (!currentPrefs) throw new Error('Account preferences not found');

      const updatedPrefs = { ...currentPrefs, ...preferences };
      this.preferences.set(accountId, updatedPrefs);
      this.saveStoredData();
      return updatedPrefs;
    }

    async getPreferences(accountId: string): Promise<EmailPreferences> {
      const prefs = this.preferences.get(accountId);
      if (!prefs) throw new Error('Account preferences not found');
      return prefs;
    }

    private async getGmailFolders(account: EmailAccount): Promise<EmailFolder[]> {
      const response = await this.googleClient.request<any>({
        path: 'gmail/v1/users/me/labels'
      });

      return (response.labels || []).map(label => ({
        id: label.id!,
        name: label.name!,
        type: this.getGmailFolderType(label.type || 'custom'),
        unreadCount: label.messagesUnread || 0,
        totalCount: label.messagesTotal || 0,
        color: label.color?.backgroundColor
      }));
    }

    private getGmailFolderType(type: string): EmailFolder['type'] {
      switch (type) {
        case 'system': return 'inbox';
        case 'sent': return 'sent';
        case 'draft': return 'drafts';
        case 'trash': return 'trash';
        case 'spam': return 'spam';
        case 'starred': return 'starred';
        case 'important': return 'important';
        default: return 'custom';
      }
    }

    private async getGmailMessages(account: EmailAccount, options: {
      folder?: string;
      query?: string;
      pageToken?: string;
      maxResults?: number;
    }): Promise<{
      messages: EmailMessage[];
      nextPageToken?: string;
    }> {
      const response = await this.googleClient.request<any>({
        path: 'gmail/v1/users/me/messages',
        params: {
          q: options.query,
          pageToken: options.pageToken,
          maxResults: options.maxResults || 20,
          labelIds: options.folder ? [options.folder] : undefined
        }
      });

      const messages = await Promise.all(
        (response.messages || []).map(async (message) => {
          const full = await this.googleClient.request<any>({
            path: `gmail/v1/users/me/messages/${message.id}`
          });

          return this.parseGmailMessage(full);
        })
      );

      return {
        messages,
        nextPageToken: response.nextPageToken
      };
    }

    private parseGmailMessage(message: any): EmailMessage {
      const headers = message.payload.headers;
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

      const subject = getHeader('subject') || '';
      const from = getHeader('from') || '';
      const to = (getHeader('to') || '').split(',').map((e: string) => e.trim());
      const cc = (getHeader('cc') || '').split(',').filter(Boolean).map((e: string) => e.trim());
      const date = new Date(parseInt(message.internalDate));

      let body = '';
      if (message.payload.body?.data) {
        body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find((part: any) =>
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        cc,
        body,
        date,
        labels: message.labelIds || [],
        read: !message.labelIds?.includes('UNREAD'),
        starred: message.labelIds?.includes('STARRED') || false
      };
    }

    async sendMessage(accountId: string, message: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    }): Promise<void> {
      const account = this.accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      if (account.type === 'gmail') {
        await this.sendGmailMessage(account, message);
      } else {
        const imapService = this.imapServices.get(accountId);
        if (!imapService) throw new Error('IMAP service not found');
        await imapService.sendMessage(message);
      }
    }

    private async sendGmailMessage(account: EmailAccount, message: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    }): Promise<void> {
      const mimeMessage = [
        `From: ${account.email}`,
        `To: ${message.to.join(', ')}`,
        message.cc?.length ? `Cc: ${message.cc.join(', ')}` : '',
        message.bcc?.length ? `Bcc: ${message.bcc.join(', ')}` : '',
        `Subject: ${message.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        message.body
      ].filter(Boolean).join('\r\n');

      const encodedMessage = btoa(mimeMessage)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.googleClient.request({
        path: 'gmail/v1/users/me/messages/send',
        method: 'POST',
        body: {
          raw: encodedMessage
        }
      });
    }
  }

  // Create and export the singleton instance
  export const emailService = EmailService.instance;
}

// Re-export the class and instance from the namespace
export const EmailService = EmailServiceNS.EmailService;
export const emailService = EmailServiceNS.emailService;