import type { CalendarEvent } from '../../types';

// Mock data for development
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly sync',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
  },
  {
    id: '2',
    title: 'Project Review',
    description: 'Q1 Review',
    start: new Date(Date.now() + 86400000),
    end: new Date(Date.now() + 90000000),
  }
];

export async function fetchEvents(): Promise<CalendarEvent[]> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockEvents), 500);
  });
} 