// Authentication Test Script
// Run this in the browser console to test the authentication flow

const testAuth = async () => {
  console.log('Starting authentication test...');
  
  // 1. Test environment variables
  const envVars = {
    useMock: import.meta.env.VITE_USE_MOCK,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    authCallbackUrl: import.meta.env.VITE_AUTH_CALLBACK_URL
  };
  
  console.log('Environment variables:', envVars);
  
  // 2. Check if Supabase client is initialized
  try {
    const { supabase } = await import('./lib/supabase');
    console.log('Supabase client initialized:', !!supabase);
    
    // 3. Check current session
    const { data, error } = await supabase.auth.getSession();
    console.log('Current session:', data.session ? 'Active' : 'None');
    if (error) {
      console.error('Session error:', error);
    }
    
    // 4. Get auth URL for testing
    const { data: urlData, error: urlError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: envVars.authCallbackUrl,
        scopes: 'email profile'
      }
    });
    
    if (urlError) {
      console.error('Failed to generate auth URL:', urlError);
    } else {
      console.log('Auth URL generated:', urlData);
    }
    
    console.log('Authentication test complete!');
    return { envVars, sessionActive: !!data.session, authUrl: urlData };
  } catch (err) {
    console.error('Authentication test failed:', err);
    return { error: err.message };
  }
};

// Export for browser console use
window.testAuth = testAuth;

export default testAuth; 