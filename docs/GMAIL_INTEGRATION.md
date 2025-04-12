# Connecting Your Gmail Account

This guide explains how to connect your Gmail account to use real data in GenieFlowAI instead of mock data.

## Understanding Provider Tokens

The "No provider token available" error message appears because the application is trying to use real Google data but doesn't have the necessary permissions. A provider token is a special authentication token that allows the application to access your Google services like Gmail, Calendar, etc.

## Setting Up Real Gmail Integration

Follow these steps to connect your Gmail account:

1. **Ensure Mock Mode is Disabled**
   - In your `.env` file, make sure `VITE_USE_MOCK=false` is set
   - This tells the application you want to use real data instead of fake data

2. **Option 1: Using Google OAuth Flow (Recommended)**
   - Complete sign out of the application using the "Sign Out" button
   - Sign back in using the Google Sign-In button - **NOT** email/password
   - This is critical: you must use the Google authentication option to get provider tokens
   - Using email/password login will not grant the necessary Gmail access permissions

3. **Option 2: Using Gmail API Tokens Directly**
   - If you're having trouble with the OAuth flow, you can use Gmail API tokens directly
   - You'll need to obtain access tokens from the Google Cloud Console for your account
   - Go to the Email page and use the "Initialize Gmail Connection" section
   - Paste your token JSON in the format shown below

## Getting Gmail API Tokens for Testing

If you don't have Gmail API tokens yet, follow these steps to obtain them:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use an existing one)
   - Enable the Gmail API for your project

2. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID credentials
   - Add `http://localhost:5173` (or your development URL) as an authorized redirect URI

3. **Get Tokens Using OAuth Playground**
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon in the upper right to configure settings
   - Check "Use your own OAuth credentials" and enter your Client ID and Secret
   - Select Gmail API v1 scopes from the list (e.g., `.../auth/gmail.readonly`)
   - Click "Authorize APIs" and follow the OAuth flow
   - After authorization, click "Exchange authorization code for tokens"
   - Copy the full JSON response which should include access_token, refresh_token, etc.

4. **Sample Token Format**
```json
{
  "access_token": "ya29.a0AfB_byDtlG7MFpS9QyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "refresh_token": "1//04XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXX-XXXXXXXXXX",
  "scope": "https://www.googleapis.com/auth/gmail.readonly",
  "token_type": "Bearer",
  "expiry_date": 1698765432123
}
```

## Using the Initialize Gmail Connection

1. Copy the token JSON from the OAuth Playground or your token source
2. Paste it into the text area in the "Initialize Gmail Connection" section
3. Click "Initialize Connection"
4. If successful, you should see "Gmail connection initialized successfully"

## Troubleshooting

### Provider Token Not Available

If you see "No provider token available" even after following the steps above:

1. Make sure you're not in mock mode (check your .env file)
2. Try clearing browser cache and cookies, then repeat the OAuth flow
3. Check browser console for any errors
4. Try using direct token initialization as described above

### Connection Fails with Error

If you get an error when trying to initialize the connection:

1. Make sure the token is in the correct JSON format
2. Check that the token hasn't expired
3. Verify that you've granted the necessary permissions
4. Try getting a fresh token from the OAuth Playground

## For Developers

### How Provider Tokens Work

1. When a user signs in with Google OAuth, Supabase receives both an ID token and a provider token
2. The ID token is used for authentication (proving who you are)
3. The provider token is used for authorization (accessing Google services on your behalf)
4. The provider token is stored in the Supabase session
5. Our application retrieves this token to make authenticated Gmail API calls

### Key Files Involved

- `src/pages/GmailConnectionTest.tsx` - Test page for Gmail connection
- `src/services/auth/googleAuth.ts` - Handles Google authentication 
- `src/services/google/GoogleAPIClient.ts` - Manages Google API requests
- `src/providers/SupabaseProvider.tsx` - Manages authentication sessions
- `src/pages/AuthCallback.tsx` - Processes OAuth callback

### Debug Mode

The Gmail Test page includes debug information in the "Session Details" section. If you're having issues:

1. Check if `provider_token` exists in the session
2. Look for any error messages in the browser console
3. Verify the OAuth scopes being requested match what's needed

The app will fall back to mock mode automatically if no provider token is available, but you can force real mode by setting `VITE_USE_MOCK=false` in your environment. 