interface MockCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
  attendees?: Array<{ email: string; responseStatus: string }>;
}

export class MockGoogleClient {
  private static instance: MockGoogleClient;
  private initialized = false;
  private signedIn = false;

  private mockEvents: MockCalendarEvent[] = [
    {
      id: '1',
      summary: 'Team Standup',
      description: 'Daily team sync meeting',
      start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
      end: { dateTime: new Date(Date.now() + 7200000).toISOString() },
      location: 'Virtual Meeting Room 1',
      attendees: [
        { email: 'john@example.com', responseStatus: 'accepted' },
        { email: 'jane@example.com', responseStatus: 'tentative' }
      ]
    },
    {
      id: '2',
      summary: 'Project Review',
      description: 'Q4 project status review',
      start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
      end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
      location: 'Conference Room A',
      attendees: [
        { email: 'manager@example.com', responseStatus: 'accepted' },
        { email: 'team@example.com', responseStatus: 'needsAction' }
      ]
    },
    {
      id: '3',
      summary: 'Client Meeting',
      description: 'Product demo for potential client',
      start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
      end: { dateTime: new Date(Date.now() + 176400000).toISOString() },
      location: 'Virtual Meeting Room 2'
    }
  ];

  private constructor() {}

  static getInstance(): MockGoogleClient {
    if (!MockGoogleClient.instance) {
      MockGoogleClient.instance = new MockGoogleClient();
    }
    return MockGoogleClient.instance;
  }

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.initialized = true;
  }

  async signIn(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    this.signedIn = true;
  }

  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.signedIn = false;
  }

  async isSignedIn(): Promise<boolean> {
    return this.signedIn;
  }

  async request<T>(params: {
    path: string;
    method?: string;
    params?: Record<string, any>;
  }): Promise<T> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }

    if (!this.signedIn) {
      throw new Error('Not signed in');
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    if (params.path.includes('calendar/v3/calendars/primary/events')) {
      const maxResults = params.params?.maxResults || 10;
      return {
        items: this.mockEvents.slice(0, maxResults),
        nextPageToken: null,
        summary: 'Primary Calendar',
        timeZone: 'UTC'
      } as T;
    }

    throw new Error('Unknown API endpoint');
  }

  // Helper method to add a mock event (useful for testing)
  async addMockEvent(event: Omit<MockCalendarEvent, 'id'>): Promise<MockCalendarEvent> {
    const newEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.mockEvents.unshift(newEvent);
    return newEvent;
  }
} 