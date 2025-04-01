require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

// Try to connect and check table
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error with auth connection:', authError.message);
    } else {
      console.log('Authentication connection successful');
    }
    
    // Check if documents table exists
    console.log('Checking if documents table exists...');
    const { data, error } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1)
      .single();
      
    if (error) {
      if (error.code === '42P01') {
        console.error('The documents table does not exist. Please run the setup-database.sql script.');
      } else {
        console.error('Error accessing documents table:', error.message);
      }
      
      // Let's try again with a different query to check connection
      const { data: versionData, error: versionError } = await supabase
        .rpc('check_vector_extension');
        
      if (versionError) {
        console.error('Error checking vector extension:', versionError.message);
        return false;
      } else {
        console.log('Vector extension check:', versionData);
        return true;
      }
    } else {
      console.log('Documents table exists and is accessible!');
      return true;
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✅ Supabase connection successful!');
    console.log('Your database is configured correctly and ready to use.');
  } else {
    console.log('\n❌ Supabase connection test failed');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check that your Supabase URL and key are correct');
    console.log('2. Make sure you\'ve run the setup-database.sql script');
    console.log('3. Verify your Supabase project is active (not paused)');
    console.log('4. Check your network connection');
  }
}); 