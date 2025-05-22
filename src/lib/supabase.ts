import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the Supabase client instance
 * Using a singleton pattern to prevent multiple instances
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Get environment variables directly to avoid circular dependencies
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const authCallbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL as string;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or anon key not provided. Using mock values.');
    }
    
    // Create Supabase client with enhanced auth configuration
    supabaseInstance = createClient(
      supabaseUrl || 'https://example.supabase.co', 
      supabaseAnonKey || 'mock-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: 'genieflow-auth-token',
          storage: {
            getItem: (key) => {
              const value = localStorage.getItem(key);
              if (!value) return null;
              try {
                return JSON.parse(value);
              } catch {
                return null;
              }
            },
            setItem: (key, value) => {
              localStorage.setItem(key, JSON.stringify(value));
            },
            removeItem: (key) => {
              localStorage.removeItem(key);
            }
          }
        },
        global: {
          headers: {
            'x-application-name': 'genieflow-ai',
            'x-application-version': '1.0.0'
          }
        }
      }
    );
    
    // Set up auth state change listener
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Handle session expiry
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session token refreshed');
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        localStorage.removeItem('genieflow-auth-token');
      }
    });
    
    console.log('Created singleton Supabase client instance');
  }
  
  return supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabaseClient(); 