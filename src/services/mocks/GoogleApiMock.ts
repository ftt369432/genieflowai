/**
 * GoogleApiMock.ts
 * 
 * Mock implementation of Google API services for development and testing
 */

export interface MockGmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    mimeType: string;
    headers: Array<{name: string, value: string}>;
    body?: {
      data?: string;
      size?: number;
    };
    parts?: any[];
  };
}

export interface MockCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  location?: string;
  description?: string;
}

export class GoogleApiMock {
  /**
   * Get mock Gmail messages
   */
  static getMessages(maxResults = 10): MockGmailMessage[] {
    const messages = [];
    
    for (let i = 0; i < maxResults; i++) {
      messages.push({
        id: `mock-msg-${i}`,
        threadId: `mock-thread-${Math.floor(i / 3)}`,
        labelIds: ['INBOX', i % 2 === 0 ? 'IMPORTANT' : 'CATEGORY_PERSONAL'],
        snippet: `This is mock email #${i} content snippet...`,
        internalDate: new Date(Date.now() - i * 86400000).getTime().toString(),
        payload: {
          mimeType: 'text/html',
          headers: [
            { name: 'Subject', value: `Mock Email Subject #${i}` },
            { name: 'From', value: `Sender ${i} <sender${i}@example.com>` },
            { name: 'To', value: 'You <you@example.com>' },
            { name: 'Date', value: new Date(Date.now() - i * 86400000).toISOString() }
          ],
          body: {
            data: btoa(`<div>This is the content of mock email #${i}.</div><div>Some more content here.</div>`),
            size: 100 + i
          }
        }
      });
    }
    
    return messages;
  }

  /**
   * Get mock calendar events
   */
  static getCalendarEvents(maxResults = 10): MockCalendarEvent[] {
    const events = [];
    const now = new Date();
    
    for (let i = 0; i < maxResults; i++) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() + i);
      startDate.setHours(9 + (i % 8), 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      
      events.push({
        id: `mock-event-${i}`,
        summary: `Mock Event ${i}`,
        description: `This is a description for mock event ${i}`,
        location: i % 2 === 0 ? 'Virtual Meeting' : 'Conference Room A',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        attendees: [
          { email: 'you@example.com', responseStatus: 'accepted' },
          { email: `person${i}@example.com`, responseStatus: 'needsAction' },
          { email: `person${i + 1}@example.com`, responseStatus: i % 2 === 0 ? 'accepted' : 'declined' }
        ]
      });
    }
    
    return events;
  }

  /**
   * Get mock user profile
   */
  static getUserProfile() {
    return {
      id: 'mock-user-id',
      email: 'mock-user@example.com',
      name: 'Mock User',
      given_name: 'Mock',
      family_name: 'User',
      picture: 'https://ui-avatars.com/api/?name=Mock+User&background=random'
    };
  }

  /**
   * Get mock calendar list
   */
  static getCalendarList() {
    return {
      items: [
        {
          id: 'primary',
          summary: 'Mock User',
          primary: true
        },
        {
          id: 'work-calendar',
          summary: 'Work Calendar',
          backgroundColor: '#4285F4',
          primary: false
        },
        {
          id: 'family',
          summary: 'Family',
          backgroundColor: '#0F9D58',
          primary: false
        }
      ]
    };
  }
}

export default GoogleApiMock;