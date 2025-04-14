import { getEnv } from '../../config/env';
import { ImapFlow } from 'imapflow';
import { createTransport } from 'nodemailer';
import { EmailMessage } from './types';

export class EmailTestService {
  private static instance: EmailTestService;
  private imapClient: ImapFlow | null = null;
  private smtpClient: any = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): EmailTestService {
    if (!EmailTestService.instance) {
      EmailTestService.instance = new EmailTestService();
    }
    return EmailTestService.instance;
  }

  public async connect(): Promise<void> {
    const { 
      VITE_EMAIL_TEST_ACCOUNT,
      VITE_EMAIL_TEST_PASSWORD,
      VITE_EMAIL_TEST_IMAP_SERVER,
      VITE_EMAIL_TEST_IMAP_PORT,
      VITE_EMAIL_TEST_SMTP_SERVER,
      VITE_EMAIL_TEST_SMTP_PORT
    } = getEnv();

    try {
      // Connect to IMAP
      this.imapClient = new ImapFlow({
        host: VITE_EMAIL_TEST_IMAP_SERVER,
        port: VITE_EMAIL_TEST_IMAP_PORT,
        secure: true,
        auth: {
          user: VITE_EMAIL_TEST_ACCOUNT,
          pass: VITE_EMAIL_TEST_PASSWORD
        }
      });

      await this.imapClient.connect();
      console.log('Connected to IMAP server');

      // Connect to SMTP
      this.smtpClient = createTransport({
        host: VITE_EMAIL_TEST_SMTP_SERVER,
        port: VITE_EMAIL_TEST_SMTP_PORT,
        secure: false,
        auth: {
          user: VITE_EMAIL_TEST_ACCOUNT,
          pass: VITE_EMAIL_TEST_PASSWORD
        }
      });

      await this.smtpClient.verify();
      console.log('Connected to SMTP server');

      this.isConnected = true;
    } catch (error) {
      console.error('Error connecting to email servers:', error);
      throw error;
    }
  }

  public async getEmails(folder: string = 'INBOX'): Promise<EmailMessage[]> {
    if (!this.isConnected || !this.imapClient) {
      throw new Error('Not connected to email server');
    }

    try {
      const lock = await this.imapClient.getMailboxLock(folder);
      try {
        const messages = [];
        for await (const message of this.imapClient.fetch('1:*', { envelope: true, bodyStructure: true })) {
          messages.push({
            id: message.uid.toString(),
            threadId: message.uid.toString(),
            subject: message.envelope.subject || '(No Subject)',
            from: message.envelope.from[0].address,
            to: message.envelope.to.map(addr => addr.address).join(', '),
            date: message.envelope.date.toISOString(),
            body: '', // Will be fetched separately if needed
            snippet: message.envelope.subject || '',
            labels: [],
            attachments: false,
            isRead: false,
            isStarred: false,
            isImportant: false
          });
        }
        return messages;
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  public async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (!this.isConnected || !this.smtpClient) {
      throw new Error('Not connected to email server');
    }

    try {
      await this.smtpClient.sendMail({
        from: getEnv().VITE_EMAIL_TEST_ACCOUNT,
        to,
        subject,
        text: body
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.imapClient) {
      await this.imapClient.logout();
    }
    if (this.smtpClient) {
      this.smtpClient.close();
    }
    this.isConnected = false;
  }
}

export const emailTestService = EmailTestService.getInstance(); 