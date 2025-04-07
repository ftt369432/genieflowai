#!/usr/bin/env node

/**
 * GenieFlowAI Deployment Script
 * This script automates the process of deploying the GenieFlowAI application to production.
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
async function deploy() {
  console.log(`\n${colors.bold}${colors.green}========== GenieFlowAI Deployment ===========${colors.reset}\n`);
  
  // 1. Check if we're in the right directory
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.error(`${colors.red}Error: package.json not found. Make sure you're in the project root directory.${colors.reset}`);
    process.exit(1);
  }
  
  // 2. Check environment
  console.log(`${colors.bold}[1/7] Checking environment...${colors.reset}`);
  if (!fs.existsSync(path.join(process.cwd(), '.env.production'))) {
    console.error(`${colors.red}Error: .env.production file not found.${colors.reset}`);
    process.exit(1);
  }
  
  // 3. Install dependencies
  console.log(`\n${colors.bold}[2/7] Installing dependencies...${colors.reset}`);
  if (!executeCommand('npm install --production=false', 'Failed to install dependencies')) {
    process.exit(1);
  }
  
  // 4. Run linting
  console.log(`\n${colors.bold}[3/7] Running linter...${colors.reset}`);
  executeCommand('npm run lint --if-present', 'Linting found issues (continuing anyway)');
  
  // 5. Run tests
  console.log(`\n${colors.bold}[4/7] Running tests...${colors.reset}`);
  executeCommand('npm test -- --watchAll=false', 'Tests failed (continuing anyway)');
  
  // 6. Build the application
  console.log(`\n${colors.bold}[5/7] Building application...${colors.reset}`);
  if (!executeCommand('npm run build', 'Failed to build the application')) {
    process.exit(1);
  }
  
  // 7. Check build output
  console.log(`\n${colors.bold}[6/7] Verifying build output...${colors.reset}`);
  if (!fs.existsSync(path.join(process.cwd(), 'build'))) {
    console.error(`${colors.red}Error: Build directory not found after build process.${colors.reset}`);
    process.exit(1);
  }
  
  // 8. Deployment instructions
  console.log(`\n${colors.bold}[7/7] Deployment instructions:${colors.reset}`);
  console.log(`${colors.green}The application has been successfully built.${colors.reset}`);
  console.log(`${colors.yellow}To deploy to your web server:${colors.reset}`);
  console.log(`1. Upload the contents of the ${colors.bold}build/${colors.reset} directory to your web server`);
  console.log(`2. Configure your web server to serve the application`);
  console.log(`3. Set up proper HTTPS and domain configuration`);
  console.log(`4. Ensure API endpoints at ${colors.bold}https://api.genieflowai.com${colors.reset} are accessible\n`);
  
  console.log(`${colors.bold}${colors.green}=== Deployment preparation completed successfully ===${colors.reset}\n`);
}

// Execute the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
  process.exit(1);
}); 