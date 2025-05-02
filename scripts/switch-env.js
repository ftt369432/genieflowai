#!/usr/bin/env node
/**
 * Environment switcher for GenieFlowAI
 * 
 * This script helps you switch between local Docker development and 
 * remote Supabase/Netlify deployments by updating your .env file
 * 
 * Usage:
 * node scripts/switch-env.js local  # Switch to local Docker development
 * node scripts/switch-env.js remote # Switch to remote Supabase/Netlify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const envTemplates = {
  local: `# Local Docker Development Environment
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTl9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_MOCK_MODE=true
VITE_USE_MOCK=true

# Mock Google API
VITE_GOOGLE_API_URL=http://localhost:3001
`,

  remote: `# Remote Supabase/Netlify Environment
VITE_SUPABASE_URL=https://bpczmzsozjlqxercmnyu.supabase.co
# Replace with your actual anon key from Supabase dashboard
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MOCK_MODE=false
VITE_USE_MOCK=false

# If you have actual Google API credentials, add them here
# VITE_GOOGLE_CLIENT_ID=
# VITE_GOOGLE_CLIENT_SECRET=
`
};

function switchEnvironment(mode) {
  if (!['local', 'remote'].includes(mode)) {
    console.error('❌ Invalid mode. Use "local" or "remote"');
    process.exit(1);
  }

  console.log(`🔧 Switching to ${mode} environment`);

  // Backup existing .env if it exists
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📑 Backed up existing .env to ${backupPath}`);
  }

  // Write new environment config
  fs.writeFileSync(envPath, envTemplates[mode]);
  console.log(`✅ Created new .env for ${mode} environment`);

  if (mode === 'local') {
    console.log(`\n📋 Next steps for local development:`);
    console.log('1. Run `docker-compose up` to start the local environment');
    console.log('2. Access your app at http://localhost:3000');
    console.log('3. Access Supabase Studio at http://localhost:54322');
    console.log('4. Access MailHog at http://localhost:8025');
  } else {
    console.log(`\n📋 Next steps for remote deployment:`);
    console.log('1. Update VITE_SUPABASE_ANON_KEY in .env with your actual key');
    console.log('2. Run `npm run build` for local testing');
    console.log('3. Deploy to Netlify with `npm run deploy:netlify`');
  }

  console.log('\n✨ Environment switch complete!');
}

// Get mode from command line argument
const mode = process.argv[2]?.toLowerCase();
switchEnvironment(mode || 'local');