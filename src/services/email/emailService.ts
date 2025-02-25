import { v4 as uuidv4 } from 'uuid';
import type { Email } from '../../types';

// In-memory email storage for demo purposes
let emails: Email[] = [
  {
    id: '1',
    subject: 'Welcome to GenieflowAI',
    from: 'support@genieflowai.com',
    to: ['user@example.com'],
    content: 'Thank you for choosing GenieflowAI. Get started by exploring our features...',
    date: new Date(),
    read: false,
    category: 'important'
  }
];

const mockEmails: Email[] = [
  {
    id: '1',
    subject: 'Project Update',
    from: 'team@example.com',
    to: ['me@example.com'],
    content: 'Latest project updates...',
    date: new Date(),
    read: false
  },
  {
    id: '2',
    subject: 'Meeting Notes',
    from: 'manager@example.com',
    to: ['me@example.com'],
    content: 'Notes from today\'s meeting...',
    date: new Date(Date.now() - 3600000),
    read: true
  }
];

export async function fetchEmails(): Promise<Email[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockEmails), 500);
  });
}

export async function sendEmail(email: Partial<Email>): Promise<boolean> {
  const newEmail: Email = {
    id: uuidv4(),
    subject: email.subject || '',
    from: 'user@example.com',
    to: email.to || [],
    content: email.content || '',
    date: new Date(),
    read: true,
    category: email.category || 'other'
  };

  emails = [newEmail, ...emails];
  return true;
}

export async function markEmailAsRead(emailId: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, read: true } : email
  );
}

export async function deleteEmails(emailIds: string[]): Promise<void> {
  emails = emails.filter(email => !emailIds.includes(email.id));
}

export async function moveToFolder(emailIds: string[], folderId: string): Promise<void> {
  // In a real app, this would update the email's folder
  console.log(`Moving emails ${emailIds.join(', ')} to folder ${folderId}`);
}