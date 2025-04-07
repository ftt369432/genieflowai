const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists
let envFileExists = false;
let currentEnv = {};

try {
  if (fs.existsSync(envPath)) {
    envFileExists = true;
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse existing environment variables
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          currentEnv[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    console.log('Existing .env file found.');
  }
} catch (err) {
  console.error('Error checking .env file:', err);
}

// Ask for Supabase credentials
console.log('\n==== Supabase Configuration ====');
console.log('Please enter your Supabase project details:');

rl.question('Supabase URL: ', (supabaseUrl) => {
  rl.question('Supabase Anon Key: ', (supabaseAnonKey) => {
    rl.question('OpenAI API Key (for embeddings): ', (openaiApiKey) => {
      // Update environment variables
      currentEnv['VITE_SUPABASE_URL'] = supabaseUrl;
      currentEnv['VITE_SUPABASE_ANON_KEY'] = supabaseAnonKey;
      
      if (openaiApiKey) {
        currentEnv['VITE_OPENAI_API_KEY'] = openaiApiKey;
      }
      
      // Convert to .env format
      const envContent = Object.entries(currentEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Write to .env file
      fs.writeFileSync(envPath, envContent);
      
      console.log('\nEnvironment variables updated successfully!');
      console.log('\nNext steps:');
      console.log('1. Run SQL setup script in Supabase SQL Editor:');
      console.log('   cat setup-database.sql | pbcopy  # Copy to clipboard');
      console.log('2. Test your Supabase connection:');
      console.log('   node test-supabase.js');
      
      rl.close();
    });
  });
}); 