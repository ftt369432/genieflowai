#!/usr/bin/env node

/**
 * GenieFlowAI Netlify Deployment Script
 * This script automates the process of deploying the GenieFlowAI application to Netlify.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

/**
 * Executes a shell command and prints the output
 * @param {string} command - Command to execute
 * @param {string} errorMessage - Message to display on error
 */
function executeCommand(command, errorMessage) {
  try {
    console.log(`${colors.blue}> ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}${errorMessage}${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Main deployment function
 */
async function deployToNetlify() {
  console.log(`\n${colors.bold}${colors.green}========== GenieFlowAI Netlify Deployment ===========${colors.reset}\n`);
  
  // 1. Check if we're in the right directory
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.error(`${colors.red}Error: package.json not found. Make sure you're in the project root directory.${colors.reset}`);
    process.exit(1);
  }
  
  // 2. Check environment
  console.log(`${colors.bold}[1/6] Checking environment...${colors.reset}`);
  
  // 3. Install dependencies
  console.log(`\n${colors.bold}[2/6] Installing dependencies...${colors.reset}`);
  if (!executeCommand('npm install --production=false', 'Failed to install dependencies')) {
    process.exit(1);
  }
  
  // 4. Run linting
  console.log(`\n${colors.bold}[3/6] Running linter...${colors.reset}`);
  executeCommand('npm run lint --if-present', 'Linting found issues (continuing anyway)');
  
  // 5. Build the application
  console.log(`\n${colors.bold}[4/6] Building application...${colors.reset}`);
  if (!executeCommand('npm run build', 'Failed to build the application')) {
    process.exit(1);
  }
  
  // 6. Deploy to Netlify
  console.log(`\n${colors.bold}[5/6] Deploying to Netlify...${colors.reset}`);
  
  // Ask if this should be a production or draft deployment
  console.log(`\n${colors.yellow}Do you want to deploy to production? (y/n)${colors.reset}`);
  process.stdin.once('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    if (input === 'y' || input === 'yes') {
      if (!executeCommand('npx netlify deploy --prod', 'Failed to deploy to Netlify')) {
        process.exit(1);
      }
    } else {
      if (!executeCommand('npx netlify deploy', 'Failed to deploy to Netlify')) {
        process.exit(1);
      }
    }
    
    // 7. Deployment complete
    console.log(`\n${colors.bold}[6/6] Deployment complete!${colors.reset}`);
    console.log(`${colors.green}The application has been successfully deployed to Netlify.${colors.reset}`);
    console.log(`${colors.bold}${colors.green}=== Netlify deployment completed successfully ===${colors.reset}\n`);
    
    process.exit(0);
  });
}

// Execute the deployment
deployToNetlify().catch(error => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
  process.exit(1);
}); 