import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY } from '../config/config';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

class GoogleApiService {
  private accessToken: string | null = null;

  constructor() {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: true,
      scopes: SCOPES,
    });
  }

  async signIn(): Promise<void> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      this.accessToken = (await GoogleSignin.getTokens()).accessToken;
      console.log('User Info:', userInfo);
      console.log('Access Token:', this.accessToken);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error.message, error.code);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      this.accessToken = null;
      console.log('Signed out from Google');
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
      throw error;
    }
  }

  async getCalendarEvents(maxResults = 10) {
    try {
      const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID);
      oAuth2Client.setCredentials({ access_token: this.accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      if (events && events.length > 0) {
        events.map((event: any) => {
          console.log('Event:', event.summary, event.start.dateTime || event.start.date);
        });
        return events;
      } else {
        console.log('No upcoming events found.');
        return [];
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async createTask(title: string, notes: string | undefined = undefined, due?: string) {
    try {
      const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID);
      oAuth2Client.setCredentials({ access_token: this.accessToken });

      const tasks = google.tasks({ version: 'v1', auth: oAuth2Client });
      const task = {
        title: title,
        notes: notes,
        due: due,
      };

      const result = await tasks.tasks.insert({
        tasklist: '@default',
        requestBody: task,
      });

      console.log('Task created:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }
}

export default new GoogleApiService();
