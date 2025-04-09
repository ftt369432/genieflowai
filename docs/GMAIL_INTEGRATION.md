# Connecting Your Gmail Account

This guide explains how to connect your Gmail account to use real data in GenieFlowAI instead of mock data.

## Understanding Provider Tokens

The "No provider token available" error message appears because the application is trying to use real Google data but doesn't have the necessary permissions. A provider token is a special authentication token that allows the application to access your Google services like Gmail, Calendar, etc.

## Setting Up Real Gmail Integration

Follow these steps to connect your Gmail account:

1. **Ensure Mock Mode is Disabled**
   - In your `.env` file, make sure `VITE_USE_MOCK=false` is set
   - This tells the application you want to use real data instead of fake data

2. **Log Out and Log Back In with Google**
   - Log out of the application if you're currently logged in
   - Log back in using the Google Sign-In button (not email/password)

3. **Grant Required Permissions**
   - Google will ask you to authorize the application to access your Gmail
   - Review the permissions and click "Allow"
   - This will generate a provider token that gets stored in your Supabase session

4. **Check Success**
   - After successful login, you should see "Successfully connected to Google" in the console
   - Your Gmail data should now load instead of mock data

## Troubleshooting

If you're still experiencing issues:

### No Provider Token Available
This means the Google OAuth flow hasn't completed successfully or you're using mock credentials. Solutions:

1. Make sure `VITE_USE_MOCK=false` in `.env`
2. Log out completely
3. Clear browser cache and cookies
4. Log in specifically using the Google button

### Gmail Integration Not Working
If Gmail integration still doesn't work after getting a provider token:

1. Check the browser console for errors
2. Ensure the Google OAuth configuration has the proper scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (minimum)
   - `https://www.googleapis.com/auth/gmail.modify` (to mark emails read/unread)
   - `https://www.googleapis.com/auth/gmail.compose` (to draft emails)
   - `https://www.googleapis.com/auth/gmail.send` (to send emails)

3. Verify that the Google Cloud project has Gmail API enabled

## For Developers

The provider token handling happens in these files:

- `src/services/google/GoogleAPIClient.ts` - Manages the Google API authentication
- `src/services/auth/googleAuth.ts` - Handles Google authentication flow
- `src/pages/AuthCallback.tsx` - Processes the OAuth callback

The app will fall back to mock mode automatically if no provider token is available, but you can force real mode by setting `VITE_USE_MOCK=false` in your environment. 