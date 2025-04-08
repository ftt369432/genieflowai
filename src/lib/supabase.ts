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
    // Get environment configuration
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    
    // Create Supabase client
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    console.log('Created singleton Supabase client instance');
  }
  
  return supabaseInstance;
}

// Export the singleton getter
export const supabase = getSupabaseClient(); 