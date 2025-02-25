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