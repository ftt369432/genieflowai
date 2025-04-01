require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Log the Supabase URL and key (with obfuscation for security)
console.log('Supabase URL defined:', !!process.env.VITE_SUPABASE_URL);
console.log('Supabase Key defined:', !!process.env.VITE_SUPABASE_ANON_KEY);

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Supabase credentials not found in .env file');
  console.log('Please make sure you have defined:');
  console.log('VITE_SUPABASE_URL=your-project-url');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Try to connect and get version
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // First, test basic connection with a health check
    const { data: healthData, error: healthError } = await supabase.rpc('check_vector_extension');
    
    if (healthError) {
      if (healthError.code === '42883') {
        console.log('Could not find vector extension check function.');
        console.log('Make sure you have run the setup-database.sql script in the Supabase SQL Editor.');
      } else {
        console.error('Error connecting to Supabase:', healthError.message);
      }
      
      // Let's try another way to test connection
      const { data: tableData, error: tableError } = await supabase
        .from('documents')
        .select('id')
        .limit(1);
        
      if (tableError) {
        if (tableError.code === '42P01') {
          console.error('The documents table does not exist yet.');
          console.log('Please run the setup-database.sql script in Supabase SQL Editor.');
        } else {
          console.error('Error accessing documents table:', tableError.message);
        }
        return false;
      } else {
        console.log('Successfully connected to Supabase and verified documents table exists.');
        return true;
      }
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('pgvector extension status:', healthData);
    
    // Check if documents table exists
    console.log('Checking if documents table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
      
    if (tableError && tableError.code === '42P01') {
      console.error('The documents table does not exist yet.');
      console.log('Please run the setup-database.sql script in Supabase SQL Editor.');
      return false;
    }
    
    console.log('Documents table is properly set up!');
    return true;
  } catch (err) {
    console.error('Unexpected error:', err.message);
    console.error('Full error:', err);
    return false;
  }
}

testConnection().then(success => {
  if (!success) {
    console.log('\nDiagnostic information:');
    console.log('1. Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('2. Supabase key starts with:', process.env.VITE_SUPABASE_ANON_KEY.substring(0, 5) + '...');
    
    console.log('\nTo fix this issue:');
    console.log('1. Verify your Supabase URL and anon key are correct in the .env file');
    console.log('2. Make sure you\'ve run the setup-database.sql script in the SQL Editor');
    console.log('3. Check that your Supabase project is active and not in maintenance mode');
    console.log('4. Ensure you have internet connectivity to Supabase servers');
    process.exit(1);
  } else {
    console.log('\nYour Supabase connection is working properly!');
    console.log('You can now proceed with using the document service.');
  }
}); 