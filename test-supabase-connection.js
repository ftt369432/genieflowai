import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bpczmzsozjlqxercmnyu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// Log the Supabase URL and key (with obfuscation for security)
console.log('Testing connection with:');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key defined:', !!supabaseKey);

if (!supabaseKey) {
  console.error('Supabase key not found in environment variables');
  console.log('Please make sure you have defined VITE_SUPABASE_ANON_KEY or SUPABASE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    console.log('✅ Authentication service is working');

    // Check if documents table exists
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.error('The documents table does not exist. Please run the setup-database.sql script.');
      throw new Error('Documents table not found');
    } else if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Documents table exists and is accessible');

    // Check PostgreSQL version to ensure compatibility
    const { data: versionData, error: versionError } = await supabase
      .rpc('version')
      .single();

    if (versionError && versionError.message.includes('function "version" does not exist')) {
      console.log('ℹ️ PostgreSQL version check skipped - function not available');
    } else if (versionError) {
      console.warn('⚠️ Could not verify PostgreSQL version:', versionError.message);
    } else {
      console.log(`✅ PostgreSQL version: ${versionData || 'Unknown'}`);
    }

    console.log('\n✅ Supabase connection successful!');
    console.log('Your database is configured correctly and ready to use.');
  } catch (error) {
    console.log('\n❌ Supabase connection test failed');
    console.error('Error:', error.message);
    console.log('Troubleshooting steps:');
    console.log('1. Check that your Supabase URL and key are correct');
    console.log('2. Make sure you\'ve run the setup-database.sql script');
    console.log('3. Verify your Supabase project is active (not paused)');
    process.exit(1);
  }
}

// Run the test
testConnection(); 