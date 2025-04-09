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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or anon key not provided. Using mock values.');
    }
    
    // Create Supabase client
    supabaseInstance = createClient(
      supabaseUrl || 'https://example.supabase.co', 
      supabaseAnonKey || 'mock-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    
    console.log('Created singleton Supabase client instance');
  }
  
  return supabaseInstance;
}

// Export the singleton getter
export const supabase = getSupabaseClient(); 