import { z } from 'zod';

const googleConfigSchema = z.object({
  clientId: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string())
});

export type GoogleConfig = z.infer<typeof googleConfigSchema>;

export const googleConfig: GoogleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scopes: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/contacts.readonly'
  ]
};

export const mockGoogleConfig = {
  clientId: 'mock-client-id',
  clientSecret: 'mock-client-secret',
  redirectUri: 'http://localhost:3000/auth/callback',
  scopes: [
    'profile',
    'email',
    'calendar.readonly',
    'gmail.readonly'
  ]
};