#!/usr/bin/env node

/**
 * GenieFlowAI Production Deployment Script
 * 
 * This script:
 * 1. Runs the production cleanup to remove test files
 * 2. Builds the application for production
 * 3. Deploys to Netlify production environment
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Banner
console.log(`
${colors.blue}${colors.bright}=======================================${colors.reset}
${colors.blue}${colors.bright}  GenieFlowAI Production Deployment   ${colors.reset}
${colors.blue}${colors.bright}=======================================${colors.reset}
`);

const rootDir = path.resolve(__dirname, '..');

// Make sure we're in the right directory
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error(`${colors.red}Error: package.json not found. Make sure you are running this script from the project root.${colors.reset}`);
  process.exit(1);
}

// Function to run a command and log its output
function runCommand(command, description) {
  console.log(`\n${colors.yellow}${colors.bright}${description}${colors.reset}`);
  console.log(`${colors.dim}$ ${command}${colors.reset}\n`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to execute: ${command}${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    return false;
  }
}

// 1. Check environment variables
console.log(`${colors.yellow}Checking environment variables...${colors.reset}`);
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingEnvVars.length > 0) {
  console.error(`${colors.red}Missing required environment variables: ${missingEnvVars.join(', ')}${colors.reset}`);
  console.error(`${colors.red}Please set these variables before deploying.${colors.reset}`);
  process.exit(1);
}

// 2. Run the production cleanup script
if (!runCommand('node scripts/production-cleanup.js', 'Running production cleanup')) {
  console.error(`${colors.red}Production cleanup failed. Fix errors before continuing.${colors.reset}`);
  process.exit(1);
}

// 3. Install production dependencies only
if (!runCommand('npm ci --production', 'Installing production dependencies')) {
  console.error(`${colors.red}Failed to install production dependencies.${colors.reset}`);
  process.exit(1);
}

// 4. Run tests for production verification
if (!runCommand('npm run test:prod', 'Running production verification tests')) {
  console.log(`${colors.yellow}Warning: Production tests had issues. Review before continuing.${colors.reset}`);
  
  // Prompt to continue
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question(`${colors.yellow}Do you want to continue with deployment? (y/n) ${colors.reset}`, (answer) => {
    readline.close();
    if (answer.toLowerCase() !== 'y') {
      console.log(`${colors.blue}Deployment aborted.${colors.reset}`);
      process.exit(0);
    } else {
      continueDeploy();
    }
  });
} else {
  continueDeploy();
}

// Continue deployment after checks
function continueDeploy() {
  // 5. Build the production app
  if (!runCommand('npm run build', 'Building for production')) {
    console.error(`${colors.red}Build failed. Fix errors before deploying.${colors.reset}`);
    process.exit(1);
  }
  
  // 6. Deploy to Netlify production
  if (!runCommand('netlify deploy --prod', 'Deploying to Netlify production')) {
    console.error(`${colors.red}Deployment to Netlify failed.${colors.reset}`);
    process.exit(1);
  }
  
  // 7. Final success message
  console.log(`\n${colors.green}${colors.bright}✓ GenieFlowAI has been successfully deployed to production!${colors.reset}`);
  console.log(`${colors.green}✓ Your app is now live at: https://genieflowai.com${colors.reset}`);
  
  // 8. Reminder for post-deployment steps
  console.log(`\n${colors.yellow}Post-deployment checklist:${colors.reset}`);
  console.log(`${colors.yellow}1. Verify all features are working in production${colors.reset}`);
  console.log(`${colors.yellow}2. Check analytics are properly recording visits${colors.reset}`);
  console.log(`${colors.yellow}3. Verify email services are functioning${colors.reset}`);
  console.log(`${colors.yellow}4. Review Supabase logs for any errors${colors.reset}`);
}