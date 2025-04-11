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
   - If you're on the Gmail Test page, use the Sign Out button there
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
   - After successful authentication, you should see:
     - "✓ You are authenticated with Google"
     - "✓ Provider token is available"
   - If you still see "No provider token available" after logging in with Google, try clearing your browser cache and cookies, then repeat steps 2-4

## Troubleshooting

### Provider Token Not Available

If you see "No provider token available" even after following the steps above:

1. **Check Third-Party Cookies**
   - Make sure your browser allows third-party cookies
   - Some privacy settings might block the authentication process

2. **Use Incognito/Private Window**
   - Try logging in with a fresh incognito/private window
   - This eliminates potential conflicts with existing cookies or sessions

3. **Clear Browser Data**
   - Clear your browser cache, cookies, and local storage
   - In Chrome: Settings → Privacy and Security → Clear browsing data
   - Make sure to include cookies and site data

4. **Check for Browser Extensions**
   - Temporarily disable privacy/ad-blocking extensions
   - These can sometimes interfere with OAuth flows

5. **Examine Session Details**
   - On the Gmail Test page, check the Session Details section
   - Look for `provider_token` in the JSON - if it's missing entirely, the OAuth flow didn't complete correctly

### Gmail API Access Issues

If you have a provider token but still can't access Gmail data:

1. **Check OAuth Scopes**
   - The application needs specific scopes to access Gmail
   - Required scopes include `https://www.googleapis.com/auth/gmail.readonly`
   - If you previously connected with insufficient scopes, you'll need to disconnect and reconnect

2. **Provider Token Expiration**
   - Provider tokens expire after a certain period
   - If your token is expired, sign out and sign back in with Google

3. **API Quota Limits**
   - Google APIs have usage quotas
   - If you exceed these limits, API calls will fail
   - Check browser console for quota-related errors

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