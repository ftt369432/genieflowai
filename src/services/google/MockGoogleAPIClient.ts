interface MockCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

export class MockGoogleAPIClient {
  private static instance: MockGoogleAPIClient;
  private initialized = false;
  private signedIn = false;

  private mockEvents: MockCalendarEvent[] = [
    {
      id: '1',
      summary: 'Team Meeting',
      start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
      end: { dateTime: new Date(Date.now() + 7200000).toISOString() }
    },
    {
      id: '2',
      summary: 'Project Review',
      start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
      end: { dateTime: new Date(Date.now() + 90000000).toISOString() }
    },
    {
      id: '3',
      summary: 'Client Call',
      start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
      end: { dateTime: new Date(Date.now() + 176400000).toISOString() }
    }
  ];

  static getInstance(): MockGoogleAPIClient {
    if (!MockGoogleAPIClient.instance) {
      MockGoogleAPIClient.instance = new MockGoogleAPIClient();
    }
    return MockGoogleAPIClient.instance;
  }

  async initialize(): Promise<void> {
    // Simulate API initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.initialized = true;
  }

  async signIn(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }
    // Simulate sign-in delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.signedIn = true;
  }

  async signOut(): Promise<void> {
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

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (params.path.includes('calendar')) {
      return {
        items: this.mockEvents,
        nextPageToken: null
      } as T;
    }

    throw new Error('Unknown API endpoint');
  }
} 