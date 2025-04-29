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
    try {
      // Get environment variables directly to avoid circular dependencies
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      
      console.log('Initializing Supabase with URL:', supabaseUrl);
      
      // Validate URL and key
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials are missing');
        throw new Error('Invalid Supabase configuration');
      }
      
      // Verify URL format
      try {
        new URL(supabaseUrl);
      } catch (e) {
        console.error('Invalid Supabase URL format:', supabaseUrl);
        throw new Error('Invalid Supabase URL format');
      }
      
      // Create Supabase client
      supabaseInstance = createClient(
        supabaseUrl, 
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'genieflow_supabase_auth'
          }
        }
      );
      
      // Test the connection
      supabaseInstance.auth.getSession()
        .then(() => console.log('✅ Successfully connected to Supabase'))
        .catch(err => console.error('❌ Supabase connection test failed:', err));
      
      console.log('Created singleton Supabase client instance');
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      // Create a mock client in development environment
      if (import.meta.env.DEV) {
        console.log('Creating mock Supabase client for development');
        supabaseInstance = createClient(
          'https://example.supabase.co', 
          'mock-anon-key',
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          }
        );
      } else {
        throw error; // Re-throw in production
      }
    }
  }
  
  return supabaseInstance!;
}

// Export the singleton getter
export const supabase = getSupabaseClient(); 