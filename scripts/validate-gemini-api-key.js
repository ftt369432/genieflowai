#!/usr/bin/env node

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Colors for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

/**
 * Validates the Gemini API key and tests the connection
 */
async function validateGeminiApiKey() {
  console.log(`${BLUE}Validating Gemini API key...${RESET}`);
  
  // Get the API key from environment
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error(`${RED}Error: VITE_GEMINI_API_KEY environment variable is not set${RESET}`);
    console.log(`${YELLOW}Please set the VITE_GEMINI_API_KEY environment variable with your Gemini API key${RESET}`);
    return false;
  }
  
  console.log(`${GREEN}API key found${RESET}`);
  
  try {
    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log(`${BLUE}Testing connection to Gemini API...${RESET}`);
    
    // Send a simple test message
    const result = await model.generateContent('Hello, this is a test message. Please respond with "Connected successfully".');
    const response = await result.response;
    const text = response.text();
    
    console.log(`${GREEN}Connection successful!${RESET}`);
    console.log(`${BLUE}Response from Gemini:${RESET} ${text.substring(0, 100)}...`);
    
    return true;
  } catch (error) {
    console.error(`${RED}Error connecting to Gemini API:${RESET}`, error.message);
    console.log(`${YELLOW}Please check that your API key is valid and that you have access to the Gemini API.${RESET}`);
    
    if (error.message.includes('403') || error.message.includes('401')) {
      console.log(`${YELLOW}This appears to be an authentication error. Your API key may be invalid or expired.${RESET}`);
    } else if (error.message.includes('429')) {
      console.log(`${YELLOW}This appears to be a rate limiting error. You may have exceeded your API quota.${RESET}`);
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log(`${YELLOW}This appears to be a connection error. Please check your internet connection.${RESET}`);
    }
    
    return false;
  }
}

// Run the validation
validateGeminiApiKey()
  .then(isValid => {
    if (isValid) {
      console.log(`${GREEN}✓ Gemini API key is valid and connection is working.${RESET}`);
      process.exit(0);
    } else {
      console.error(`${RED}✗ Gemini API key validation failed.${RESET}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`${RED}An unexpected error occurred:${RESET}`, error);
    process.exit(1);
  }); 