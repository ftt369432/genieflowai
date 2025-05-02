/**
 * GenieFlowAI Production Cleanup Script
 * 
 * This script removes development and test files that are not needed in production.
 * Run this script before deploying to production to keep the codebase clean.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.yellow}${colors.bright}Starting production cleanup...${colors.reset}`);

const rootDir = path.resolve(__dirname, '..');

// Files to remove (relative to project root)
const filesToRemove = [
  // Test files in root
  'test-document-gemini.js',
  'test-document-upload.js',
  'test-supabase-connection.js',
  'test-supabase.js',
  'jest.config.js',
  
  // Development documentation
  'TODO.md',
  'PROGRESS.md',
  'QA_CHECKLIST.md',
  'LAUNCH_CHECKLIST.md',
  
  // Test files in src
  'src/test-auth.js',
  'src/test-config.ts',
  'src/TODO.md',
  'src/QA_CHECKLIST.md',
  
  // Development configuration
  '.env.development',
  'src/LAUNCH_PLAN.md',
];

// Directories to remove (relative to project root)
const dirsToRemove = [
  'src/tests',
  'public/gemini-test.html',
  'public/gemini-direct-test.html',
  'public/legal-assistant-test.html',
];

// Files to backup before modifying
const filesToBackup = [
  'package.json',
  'vite.config.js',
  'netlify.toml',
  'src/env.ts',
];

// Create backups directory if it doesn't exist
const backupDir = path.join(rootDir, '.backups', `pre-prod-${new Date().toISOString().replace(/[:.]/g, '-')}`);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`${colors.green}Created backup directory: ${backupDir}${colors.reset}`);
}

// Backup important files
filesToBackup.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const fileDir = path.dirname(file);
    const backupFilePath = path.join(backupDir, file);
    const backupFileDir = path.dirname(backupFilePath);
    
    if (!fs.existsSync(backupFileDir)) {
      fs.mkdirSync(backupFileDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupFilePath);
    console.log(`${colors.green}Backed up: ${file}${colors.reset}`);
  }
});

// Remove files
let filesRemoved = 0;
filesToRemove.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`${colors.green}Removed file: ${file}${colors.reset}`);
      filesRemoved++;
    } catch (err) {
      console.error(`${colors.red}Failed to remove ${file}: ${err.message}${colors.reset}`);
    }
  }
});

// Remove directories
let dirsRemoved = 0;
dirsToRemove.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    try {
      if (fs.lstatSync(dirPath).isDirectory()) {
        fs.rmdirSync(dirPath, { recursive: true });
        console.log(`${colors.green}Removed directory: ${dir}${colors.reset}`);
        dirsRemoved++;
      } else {
        fs.unlinkSync(dirPath);
        console.log(`${colors.green}Removed file: ${dir}${colors.reset}`);
        filesRemoved++;
      }
    } catch (err) {
      console.error(`${colors.red}Failed to remove ${dir}: ${err.message}${colors.reset}`);
    }
  }
});

// Remove devDependencies from package.json
console.log(`\n${colors.yellow}Updating package.json for production...${colors.reset}`);
try {
  // Keep only dependencies needed for production
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = require(packageJsonPath);
  
  // Save original scripts that we want to keep
  const essentialScripts = {
    "start": packageJson.scripts.start,
    "build": packageJson.scripts.build,
    "serve": packageJson.scripts.serve || "vite preview",
    "test:prod": packageJson.scripts["test:prod"] || "echo 'No production tests configured'"
  };
  
  // Remove all test scripts except test:prod
  packageJson.scripts = essentialScripts;
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`${colors.green}Updated package.json for production${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Failed to update package.json: ${err.message}${colors.reset}`);
}

// Update import statements to remove mock services
console.log(`\n${colors.yellow}Scanning for and removing mock imports...${colors.reset}`);

try {
  // Run a recursive grep to find files with mock imports
  const grepCmd = process.platform === 'win32'
    ? `findstr /s /m "mock" "${rootDir}\\src\\**\\*.ts" "${rootDir}\\src\\**\\*.tsx" "${rootDir}\\src\\**\\*.js" "${rootDir}\\src\\**\\*.jsx"`
    : `grep -r --include="*.{ts,tsx,js,jsx}" "mock" "${rootDir}/src/"`;
  
  const filesWithMockImports = execSync(grepCmd, { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => process.platform === 'win32' ? line : line.split(':')[0]);
  
  console.log(`${colors.yellow}Found ${filesWithMockImports.length} files with potential mock imports${colors.reset}`);
  
  filesWithMockImports.forEach(filePath => {
    console.log(`${colors.yellow}Checking: ${filePath}${colors.reset}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}File doesn't exist, skipping: ${filePath}${colors.reset}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove import statements for mock files
    content = content.replace(/import\s+.*\s+from\s+['"].*mock.*['"]/g, '// Production build - mock imports removed');
    content = content.replace(/import\s+{\s*.*mock.*\s*}\s+from\s+['"](.*)['"]/g, '// Production build - mock imports removed');
    
    // Remove mock-related environment variable checks
    content = content.replace(/if\s*\(\s*process\.env\.NODE_ENV\s*!==\s*['"]production['"]\s*\)\s*{[\s\S]*?}/g, 
      '// Production build - development code removed');
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`${colors.green}Updated: ${filePath}${colors.reset}`);
    }
  });
} catch (err) {
  console.error(`${colors.red}Error scanning for mock imports: ${err.message}${colors.reset}`);
}

// Summary
console.log(`\n${colors.green}${colors.bright}Production cleanup completed:${colors.reset}`);
console.log(`${colors.green}- ${filesRemoved} files removed${colors.reset}`);
console.log(`${colors.green}- ${dirsRemoved} directories removed${colors.reset}`);
console.log(`${colors.green}- Package.json optimized for production${colors.reset}`);
console.log(`${colors.green}- Mock imports cleaned up${colors.reset}`);
console.log(`${colors.green}- Backups created in ${backupDir}${colors.reset}`);

console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`${colors.yellow}1. Review the changes${colors.reset}`);
console.log(`${colors.yellow}2. Run 'npm run build' to verify the production build${colors.reset}`);
console.log(`${colors.yellow}3. Deploy using 'npm run deploy-prod'${colors.reset}`);