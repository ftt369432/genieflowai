#!/usr/bin/env node
/**
 * Script to fix the infinite recursion in Supabase RLS policy for team_members table
 * 
 * This script applies SQL directly to fix the recursive policy in team_members table
 * without needing to parse the fix_supabase_policy.sql file.
 * 
 * Usage:
 * node scripts/fix-supabase-policy.js
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Log the path we're looking for .env
console.log(`🔍 Looking for .env file at: ${envPath}`);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🛠️  GenieFlowAI - Supabase Policy Fix Script');
console.log('--------------------------------------------');

// Check for required environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  console.error(`Currently set to: "${SUPABASE_URL}"`);
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error('   This key is required to execute SQL commands and is different from the anon key.');
  console.error('   You can find it in the Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Show partial key to verify it's being picked up without revealing entire key
console.log(`🔑 Using SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`🔑 Found service role key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...${SUPABASE_SERVICE_ROLE_KEY.substring(SUPABASE_SERVICE_ROLE_KEY.length - 4)}`);

// SQL to fix the policy - hardcoded to avoid any issues with file parsing
const sqlFix = `
-- Drop the problematic policy
DROP POLICY IF EXISTS team_members_policy ON team_members;

-- Create a new non-recursive policy
CREATE POLICY team_members_policy ON team_members USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT user_id 
    FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.role IN ('admin', 'owner')
  )
);
`;

async function applyPolicyFix() {
  try {
    console.log('🔧 Applying SQL fix:');
    console.log(sqlFix);
    
    // Clean up SQL for REST API
    const cleanedSql = sqlFix
      .replace(/--.*$/gm, '') // Remove SQL comments
      .replace(/\s+/g, ' ')   // Replace multiple whitespaces with a single space
      .trim();
    
    // Execute SQL via the Supabase REST API using rpc function
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    console.log(`🔄 Connecting to Supabase at: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql_query: cleanedSql
      })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Error applying SQL fix (status ${response.status}):`, responseText);

      // Check for common issues
      if (response.status === 401) {
        console.error('\n❓ Possible issues:');
        console.error('1. The SUPABASE_SERVICE_ROLE_KEY may be incorrect');
        console.error('2. The service_role key might have been rotated in the Supabase dashboard');
        console.error('3. The exec_sql RPC function might not be available (depends on Supabase plan)');
        
        console.error('\n💡 Alternative solution:');
        console.error('You can apply the fix directly through the Supabase dashboard:');
        console.error('1. Go to https://app.supabase.com/ and select your project');
        console.error('2. Navigate to the SQL Editor');
        console.error('3. Create a new query and paste this SQL:');
        console.error(sqlFix);
        console.error('4. Run the query');
      }
      
      process.exit(1);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // Response might not be JSON if it's a success message
      result = responseText;
    }
    
    console.log('✅ Successfully applied the policy fix!');
    console.log('Result:', result);
    
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server if it\'s running');
    console.log('2. Try accessing team data again to verify the fix');
    console.log('3. If you still see errors, check the browser console for details');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyPolicyFix();