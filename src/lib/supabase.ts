import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';

// Get environment configuration
const { supabaseUrl, supabaseAnonKey } = getEnv();

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 