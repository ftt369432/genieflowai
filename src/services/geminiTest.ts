import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '../config/env';

interface TestResult {
  success: boolean;
  connectionTest: { success: boolean; message: string };
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const env = getEnv();
    const apiKey = env.geminiApiKey;
    
    if (!apiKey) {
      console.error('No Gemini API key found');
      return false;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Test with a simple prompt
    const result = await model.generateContent('Test connection to Gemini API');
    const response = await result.response;
    const text = response.text();

    return text.length > 0;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}

/**
 * Test function to verify the Gemini service functionality
 * This can be run to check if the Gemini API is working correctly
 */
export async function testGeminiService(): Promise<TestResult> {
  console.log('Testing Gemini service...');
  
  // Log environment info for debugging
  const { nodeEnv, aiProvider, aiModel, geminiApiKey } = getEnv();
  console.log('Environment info:', {
    nodeEnv,
    aiProvider,
    aiModel,
    hasApiKey: !!geminiApiKey,
    isServiceReady: await testGeminiConnection()
  });
  
  try {
    // Test 1: Check if the service is properly initialized and connected
    console.log('Testing connection...');
    const connectionTest = {
      success: await testGeminiConnection(),
      message: 'Connection test completed'
    };
    console.log('Connection test result:', connectionTest);
    
    // If connection test fails, return early
    if (!connectionTest.success) {
      return {
        success: false,
        connectionTest
      };
    }
    
    return {
      success: connectionTest.success,
      connectionTest
    };
  } catch (error) {
    console.error('Error during Gemini service test:', error);
    return {
      success: false,
      connectionTest: {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}