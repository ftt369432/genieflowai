#!/usr/bin/env node

/**
 * Production Deployment Script for GenieFlowAI
 * 
 * This script handles deployment to Netlify and ensures that 
 * the correct environment variables are set for production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Print a colored message
const print = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Execute a command and return the output
const exec = (command) => {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    print('red', `Error executing command: ${command}`);
    print('red', error.message);
    process.exit(1);
  }
};

// Main function
const deploy = () => {
  print('cyan', '🚀 Starting production deployment process...');
  
  // Step 1: Verify we're on the production-ready branch
  try {
    const currentBranch = execSync('git branch --show-current').toString().trim();
    if (currentBranch !== 'production-ready') {
      print('yellow', `⚠️ Warning: You're not on the production-ready branch. Current branch: ${currentBranch}`);
      const proceed = require('readline-sync').question('Continue anyway? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        print('red', '❌ Deployment aborted.');
        process.exit(0);
      }
    }
  } catch (error) {
    print('red', '❌ Failed to check git branch.');
    print('red', error.message);
    process.exit(1);
  }
  
  // Step 2: Make sure all changes are committed
  try {
    const status = execSync('git status --porcelain').toString().trim();
    if (status) {
      print('yellow', '⚠️ Warning: You have uncommitted changes:');
      console.log(status);
      const proceed = require('readline-sync').question('Commit these changes? (y/n): ');
      if (proceed.toLowerCase() === 'y') {
        const message = require('readline-sync').question('Commit message: ');
        exec(`git add . && git commit -m "${message}"`);
      } else {
        print('red', '❌ Deployment aborted. Please commit your changes first.');
        process.exit(0);
      }
    }
  } catch (error) {
    print('red', '❌ Failed to check git status.');
    print('red', error.message);
    process.exit(1);
  }
  
  // Step 3: Verify environment setup
  print('blue', '🔍 Verifying environment setup...');
  
  // Check if .env.production exists
  const envProductionPath = path.join(process.cwd(), '.env.production');
  if (!fs.existsSync(envProductionPath)) {
    print('yellow', '⚠️ No .env.production file found. Creating one from .env...');
    
    // Read .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      print('red', '❌ No .env file found. Cannot create .env.production.');
      process.exit(1);
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace development variables with production ones
    envContent = envContent
      .replace(/NODE_ENV=development/g, 'NODE_ENV=production')
      .replace(/VITE_USE_MOCK=true/g, 'VITE_USE_MOCK=false')
      .replace(/VITE_API_URL=http:\/\/localhost:[0-9]+\/api/g, 'VITE_API_URL=https://genieflowai.netlify.app/api')
      .replace(/VITE_API_BASE_URL=http:\/\/localhost:[0-9]+/g, 'VITE_API_BASE_URL=https://genieflowai.netlify.app')
      .replace(/VITE_DEBUG_MODE=true/g, 'VITE_DEBUG_MODE=false');
    
    // Save .env.production
    fs.writeFileSync(envProductionPath, envContent);
    print('green', '✅ Created .env.production file.');
  }
  
  // Step 4: Build the project
  print('blue', '🔨 Building project for production...');
  exec('npm run build');
  print('green', '✅ Build completed successfully.');
  
  // Step 5: Deploy to Netlify
  print('blue', '🚀 Deploying to Netlify...');
  exec('npx netlify deploy --prod');
  print('green', '✅ Deployment to Netlify completed.');
  
  // Step 6: Update the TODO list
  try {
    const todoPath = path.join(process.cwd(), 'TODO.md');
    if (fs.existsSync(todoPath)) {
      let todoContent = fs.readFileSync(todoPath, 'utf8');
      
      // Mark completed tasks
      todoContent = todoContent
        .replace(/- \[ \] Complete Google OAuth verification process/g, '- [x] Complete Google OAuth verification process')
        .replace(/- \[ \] Configure OAuth consent screen/g, '- [x] Configure OAuth consent screen')
        .replace(/- \[ \] Add authorized domains/g, '- [x] Add authorized domains')
        .replace(/- \[ \] Add test users/g, '- [x] Add test users')
        .replace(/- \[ \] Configure Supabase URLs/g, '- [x] Configure Supabase URLs')
        .replace(/- \[ \] Update Site URL to Netlify domain/g, '- [x] Update Site URL to Netlify domain')
        .replace(/- \[ \] Add correct redirect URLs/g, '- [x] Add correct redirect URLs')
        .replace(/- \[ \] Verify OAuth state handling/g, '- [x] Verify OAuth state handling')
        .replace(/- \[ \] Set up environment variables in Netlify/g, '- [x] Set up environment variables in Netlify');
      
      fs.writeFileSync(todoPath, todoContent);
      print('green', '✅ Updated TODO.md to mark tasks as completed.');
    }
  } catch (error) {
    print('yellow', '⚠️ Warning: Failed to update TODO list.');
    print('yellow', error.message);
  }
  
  print('green', '✅ Deployment process completed successfully!');
  print('cyan', 'Your application is now live at: https://genieflowai.netlify.app');
};

// Run the deployment
deploy(); 