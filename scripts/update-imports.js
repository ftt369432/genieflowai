/**
 * This script updates imports from utils/cn and utils/avatar to lib/utils
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Map of old imports to new imports
const importMap = {
  '../utils/cn': '../lib/utils',
  '../../utils/cn': '../../lib/utils',
  '../../../utils/cn': '../../../lib/utils',
  '@/utils/cn': '@/lib/utils',
  '../utils/avatar': '../lib/utils',
  '../../utils/avatar': '../../lib/utils',
  '../../../utils/avatar': '../../../lib/utils',
  '@/utils/avatar': '@/lib/utils'
};

// Function to update imports in a file
async function updateImportsInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file has any of the old imports
    let hasOldImport = false;
    for (const oldImport of Object.keys(importMap)) {
      if (content.includes(`from '${oldImport}'`)) {
        hasOldImport = true;
        break;
      }
    }
    
    if (!hasOldImport) {
      return false; // No changes needed
    }
    
    // Update imports from utils/cn to lib/utils
    let updatedContent = content;
    for (const [oldImport, newImport] of Object.entries(importMap)) {
      // Handle full import
      updatedContent = updatedContent.replace(
        new RegExp(`import \\{ (.*?) \\} from '${oldImport}'`, 'g'),
        (match, importList) => {
          // For avatar imports, update getLocalAvatar to getAvatar
          if (oldImport.includes('avatar')) {
            importList = importList.replace(/getLocalAvatar/g, 'getAvatar');
          }
          return `import { ${importList} } from '${newImport}'`;
        }
      );
      
      // Handle renamed imports specifically for avatar
      if (oldImport.includes('avatar')) {
        updatedContent = updatedContent.replace(
          new RegExp(`import \\{ getLocalAvatar as (.*?) \\} from '${oldImport}'`, 'g'),
          `import { getAvatar as $1 } from '${newImport}'`
        );
      }
    }
    
    // Update any remaining uses of getLocalAvatar to getAvatar
    if (content.includes('getLocalAvatar')) {
      updatedContent = updatedContent.replace(/getLocalAvatar/g, 'getAvatar');
    }
    
    // Only write if changes were made
    if (updatedContent !== content) {
      await writeFile(filePath, updatedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Function to recursively process all TypeScript and TSX files in a directory
async function processDirectory(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  let changedFiles = [];
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other unwanted directories
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'build' || entry.name === 'dist') {
        continue;
      }
      
      // Process subdirectory
      const subChanges = await processDirectory(entryPath);
      changedFiles = [...changedFiles, ...subChanges];
    } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.d.ts')) {
      // Process TypeScript files (excluding declaration files)
      const changed = await updateImportsInFile(entryPath);
      
      if (changed) {
        changedFiles.push(entryPath);
      }
    }
  }
  
  return changedFiles;
}

// Main function
async function main() {
  try {
    console.log('Updating imports from utils/cn and utils/avatar to lib/utils...');
    
    const srcPath = path.join(__dirname, '..', 'src');
    const changedFiles = await processDirectory(srcPath);
    
    if (changedFiles.length > 0) {
      console.log(`Updated imports in ${changedFiles.length} files:`);
      changedFiles.forEach(file => {
        console.log(`  - ${path.relative(path.join(__dirname, '..'), file)}`);
      });
    } else {
      console.log('No files needed updating.');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 