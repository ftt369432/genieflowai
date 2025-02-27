import { MockGoogleClient } from './MockGoogleClient';

export class GoogleAPIService {
  private client: MockGoogleClient;

  constructor() {
    this.client = MockGoogleClient.getInstance();
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
  }

  async signIn(): Promise<void> {
    return this.client.signIn();
  }

  async signOut(): Promise<void> {
    return this.client.signOut();
  }

  async isSignedIn(): Promise<boolean> {
    return this.client.isSignedIn();
  }

  async getCalendarEvents(params: { maxResults?: number } = {}): Promise<any> {
    return this.client.request({
      path: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      params: params
    });
  }

  // Helper method to add test events
  async addTestEvent(event: any): Promise<any> {
    if (this.client instanceof MockGoogleClient) {
      return this.client.addMockEvent(event);
    }
    throw new Error('Adding test events is only available in mock mode');
  }
} 