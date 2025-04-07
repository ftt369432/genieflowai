#!/usr/bin/env node

/**
 * GenieFlowAI Progress Tracker
 * 
 * This script helps to update the PROGRESS.md file with completed tasks
 * and recalculate the progress stats.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROGRESS_FILE = path.join(process.cwd(), 'PROGRESS.md');
const TODO_FILE = path.join(process.cwd(), 'TODO.md');

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
 * Main function to run the progress update
 */
async function main() {
  console.log(`\n${colors.bold}${colors.green}========== GenieFlowAI Progress Tracker ===========${colors.reset}\n`);
  
  // Check if progress file exists
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.error(`${colors.red}Error: PROGRESS.md file not found.${colors.reset}`);
    process.exit(1);
  }
  
  // Check if todo file exists
  if (!fs.existsSync(TODO_FILE)) {
    console.error(`${colors.red}Error: TODO.md file not found.${colors.reset}`);
    process.exit(1);
  }
  
  // Ask for the category
  const category = await askQuestion('Enter task category (e.g., "Bug Fixes & Code Cleanup"): ');
  
  // Ask for the task description
  const taskDescription = await askQuestion('Enter task description: ');
  
  // Get the current date
  const today = new Date().toISOString().split('T')[0];
  
  // Read the progress file
  let progressContent = fs.readFileSync(PROGRESS_FILE, 'utf8');
  
  // Update the completed tasks section
  const categorySection = `### ${category}`;
  if (progressContent.includes(categorySection)) {
    // If the category exists
    if (progressContent.includes('*No completed tasks yet*')) {
      // Replace the placeholder with the first completed task
      progressContent = progressContent.replace(
        `### ${category}\n*No completed tasks yet*`,
        `### ${category}\n- [x] ${taskDescription} (${today})`
      );
    } else {
      // Add to existing tasks
      const categoryIndex = progressContent.indexOf(categorySection);
      const nextCategoryIndex = progressContent.indexOf('###', categoryIndex + 1);
      
      const beforeCategory = progressContent.substring(0, categoryIndex + categorySection.length);
      let categoryContent;
      
      if (nextCategoryIndex !== -1) {
        categoryContent = progressContent.substring(categoryIndex + categorySection.length, nextCategoryIndex);
        const afterCategory = progressContent.substring(nextCategoryIndex);
        
        categoryContent = `${categoryContent}\n- [x] ${taskDescription} (${today})`;
        progressContent = beforeCategory + categoryContent + afterCategory;
      } else {
        // This is the last category
        categoryContent = progressContent.substring(categoryIndex + categorySection.length);
        categoryContent = `${categoryContent}\n- [x] ${taskDescription} (${today})`;
        progressContent = beforeCategory + categoryContent;
      }
    }
  }
  
  // Update the overall progress
  // This is a simplified version - a full implementation would parse and recalculate all progress
  console.log(`\n${colors.bold}${colors.yellow}Note: Please update the progress numbers manually in the table.${colors.reset}`);
  
  // Write updated content back to the file
  fs.writeFileSync(PROGRESS_FILE, progressContent);
  
  console.log(`\n${colors.bold}${colors.green}Task added successfully!${colors.reset}`);
  console.log(`Added to ${category}: ${taskDescription} (${today})`);
  console.log(`\n${colors.bold}Next steps:${colors.reset}`);
  console.log(`1. Update the progress table in PROGRESS.md`);
  console.log(`2. Mark the task as completed in TODO.md`);
  console.log(`3. Update any in-progress tasks\n`);
  
  rl.close();
}

/**
 * Helper function to ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.blue}${question}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}An error occurred:${colors.reset}`, error);
  process.exit(1);
}); 