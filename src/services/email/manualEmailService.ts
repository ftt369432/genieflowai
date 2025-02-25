import { v4 as uuidv4 } from 'uuid';
import type { Email } from '../../types';

// Initial demo data
const demoEmails: Email[] = [
  {
    id: uuidv4(),
    subject: 'Welcome to GenieflowAI',
    from: 'support@genieflow.ai',
    to: ['user@example.com'],
    content: 'Thank you for trying GenieflowAI. Get started by exploring our features...',
    date: new Date(),
    read: false,
    category: 'inbox'
  },
  {
    id: uuidv4(),
    subject: 'Project Update: Q4 Goals',
    from: 'manager@company.com',
    to: ['user@example.com'],
    content: 'Here are our key objectives for Q4...',
    date: new Date(Date.now() - 86400000), // 1 day ago
    read: true,
    category: 'inbox'
  },
  {
    id: uuidv4(),
    subject: 'Meeting Notes: Product Review',
    from: 'team@company.com',
    to: ['user@example.com'],
    content: 'Summary of today\'s product review meeting...',
    date: new Date(Date.now() - 172800000), // 2 days ago
    read: false,
    category: 'inbox'
  }
];

let emails: Email[] = [...demoEmails];

export async function fetchEmails(): Promise<Email[]> {
  return emails;
}

export async function sendEmail(email: Partial<Email>): Promise<boolean> {
  const newEmail = {
    id: uuidv4(),
    subject: email.subject || '',
    from: 'user@example.com',
    to: email.to || [],
    content: email.content || '',
    date: new Date(),
    read: true,
    category: email.category || 'sent'
  };

  emails = [newEmail, ...emails];
  return true;
}

export async function markEmailAsRead(emailId: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, read: true } : email
  );
}

export async function archiveEmail(emailId: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, category: 'archive' } : email
  );
}

export async function deleteEmail(emailId: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, category: 'trash' } : email
  );
}

export async function moveEmail(emailId: string, category: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, category } : email
  );
}

export async function getEmailsByCategory(category: string): Promise<Email[]> {
  return emails.filter(email => email.category === category);
}