import * as fs from 'fs';
import * as path from 'path';
// import { prompt } from 'inquirer'; // Remove this import if not used

async function configureAI() {
  // Use test data for all API keys
  const testConfig = {
    openaiKey: "test-openai-key",
    geminiKey: "test-gemini-key",
    claudeKey: "test-claude-key"
  };

  const envContent = `
VITE_OPENAI_API_KEY=${testConfig.openaiKey}
VITE_GEMINI_API_KEY=${testConfig.geminiKey}
VITE_CLAUDE_API_KEY=${testConfig.claudeKey}
# CLAUDE_API_KEY not configured
# ... other configurations
  `.trim();

  fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
}

configureAI().catch(console.error); 