# Connecting Your Gmail Account

This guide explains how to connect your Gmail account to use real data in GenieFlowAI instead of mock data.

## Understanding Provider Tokens

The "No provider token available" error message appears because the application is trying to use real Google data but doesn't have the necessary permissions. A provider token is a special authentication token that allows the application to access your Google services like Gmail, Calendar, etc.

## Setting Up Real Gmail Integration

Follow these steps to connect your Gmail account:

1. **Ensure Mock Mode is Disabled**
   - In your `.env` file, make sure `VITE_USE_MOCK=false` is set
   - This tells the application you want to use real data instead of fake data

2. **Complete Sign Out**
   - Log out of the application completely using the "Sign Out" button
   - This ensures you start with a clean session

3. **Sign In with Google OAuth**
   - Sign back in using the Google Sign-In button - **NOT** email/password
   - This is critical: you must use the Google authentication option to get provider tokens
   - Using email/password login will not grant the necessary Gmail access permissions

4. **Grant Required Permissions**
   - When redirected to Google's authorization page, you'll be asked to grant permissions
   - Make sure to allow all requested permissions (Gmail read access, profile, etc.)
   - If you don't see permission requests for Gmail, something is wrong with the OAuth configuration

5. **Verify the Connection**
   - After successful authentication, you should see your Gmail account connected
   - You can verify this by checking the email inbox page
   - If you don't see your emails, try refreshing the page

## Troubleshooting

### Provider Token Not Available

If you see "No provider token available" after logging in with Google:

1. Clear your browser cache and cookies
2. Sign out completely
3. Sign back in using the Google Sign-In button
4. Make sure to grant all requested permissions

### Key Files Involved

- `src/services/auth/googleAuth.ts` - Handles Google authentication 
- `src/services/google/GoogleAPIClient.ts` - Manages Google API requests
- `src/providers/SupabaseProvider.tsx` - Manages authentication sessions
- `src/pages/auth/GoogleCallback.tsx` - Processes OAuth callback
- `src/components/email/EmailServiceDirect.tsx` - Main Gmail connection component

### Debug Mode

If you're having issues:

1. Check the browser console for any error messages
2. Verify that you're signed in with Google (not email/password)
3. Check if the OAuth scopes being requested match what's needed
4. Ensure your `.env` file has the correct Google OAuth credentials

The app will fall back to mock mode automatically if no provider token is available, but you can force real mode by setting `VITE_USE_MOCK=false` in your environment. 