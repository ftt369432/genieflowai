import { v4 as uuidv4 } from 'uuid';
import type { Task, Email } from '../../types';

export function createTaskFromEmail(email: Email): Task {
  return {
    id: uuidv4(),
    title: email.subject,
    description: `From: ${email.from}\n\n${email.content}`,
    priority: 'medium',
    completed: false,
    tags: ['email'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  };
}

export function createTasksFromEmails(emails: Email[]): Task[] {
  return emails.map(createTaskFromEmail);
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete Project Proposal',
    description: 'Write and review the Q2 project proposal',
    priority: 'high',
    completed: false,
    tags: ['work']
  },
  {
    id: '2',
    title: 'Review Pull Requests',
    description: 'Review and merge pending PRs',
    priority: 'medium',
    completed: true,
    tags: ['development']
  }
];

export async function fetchTasks(): Promise<Task[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTasks), 500);
  });
}