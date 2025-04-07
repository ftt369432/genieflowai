# Google Calendar Integration

This document explains how to set up the Google Calendar integration for GenieFlow AI.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable the following APIs:
   - Google Calendar API
   - Google People API (for user profile information)

### 2. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Add a name for your application (e.g., "GenieFlow Calendar Integration")
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://localhost:3000/api/auth/callback/google` (for NextAuth.js)
   - Your production domain and callback URLs
7. Click "Create"
8. Note down the Client ID and Client Secret

### 3. Configure Environment Variables

Edit your `.env.local` file and add:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
```

To create an API key:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Restrict the API key to only allow access to the Google Calendar API
4. Copy the API key to your `.env.local` file

## Using the Integration

Once configured, users can:

1. Go to Settings > Calendar
2. Click "Connect Google Calendar"
3. Choose a Google account and grant the necessary permissions
4. Manage connected calendars and display preferences

## Troubleshooting

### Common Issues:

1. **Authentication Failed**: Ensure your Client ID and API Key are correctly set in `.env.local`.

2. **Calendar Not Loading**: Check browser console for errors. Ensure the Google Calendar API is enabled in your Google Cloud project.

3. **Access Denied**: Make sure the user has granted all the required permissions. The permissions needed are:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`

4. **CORS Issues**: Ensure your domain is listed in the authorized JavaScript origins in the Google Cloud Console.

## Architecture

The Google Calendar integration uses the following components:

- `googleAuthService`: Handles authentication with Google's OAuth 2.0 flow
- `CalendarService`: Manages fetching and parsing calendar data
- `CalendarAccounts`: UI component to display and manage connected accounts
- `GoogleCalendarAuth`: UI component to handle the auth flow

## Security Considerations

- Access tokens are stored in localStorage, which is secure against CSRF attacks but not XSS
- The application only requests read-only access to calendars
- OAuth scope limitations ensure the app cannot modify calendar data

## Data Flow

1. User initiates authentication through the UI
2. Google OAuth flow redirects to Google for consent
3. On successful auth, an access token is stored locally
4. The application uses this token to fetch calendar data
5. Events are displayed in the calendar interface 