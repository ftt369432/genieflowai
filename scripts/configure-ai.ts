import * as fs from 'fs';
import * as path from 'path';

async function configureAI() {
  // Use test data for Gemini API key
  const testConfig = {
    geminiKey: "test-gemini-key"
  };

  const envContent = `
VITE_GEMINI_API_KEY=${testConfig.geminiKey}
# ... other configurations
  `.trim();

  fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
  
  console.log('Created .env.local file with test Gemini API key');
}

configureAI().catch(console.error);