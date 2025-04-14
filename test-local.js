import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run a command and log output
async function runCommand(command, args) {
  const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`);
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

// Main function to run tests
async function runTests() {
  try {
    console.log('Starting local development server...');
    
    // Start the development server
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Running tests...');
    
    // Run the tests
    await runCommand('npm', ['test']);

    // Kill the server
    server.kill();
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests(); 