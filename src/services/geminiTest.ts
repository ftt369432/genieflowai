import { geminiSimplifiedService } from './gemini-simplified';

/**
 * Test function to verify the Gemini service functionality
 * This can be run to check if the Gemini API is working correctly
 */
export async function testGeminiService(): Promise<{ 
  success: boolean;
  connectionTest: { success: boolean; message: string };
  messageTest?: { success: boolean; message: string };
}> {
  console.log('Testing Gemini service...');
  
  // Log environment info for debugging
  console.log('Environment info:', {
    nodeEnv: import.meta.env.NODE_ENV,
    hasApiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
    maskedApiKey: geminiSimplifiedService.getApiKey(),
    isServiceReady: geminiSimplifiedService.isReady()
  });
  
  try {
    // Test 1: Check if the service is properly initialized and connected
    console.log('Testing connection...');
    const connectionTest = await geminiSimplifiedService.testConnection();
    console.log('Connection test result:', connectionTest);
    
    // If connection test fails, return early
    if (!connectionTest.success) {
      return {
        success: false,
        connectionTest
      };
    }
    
    // Test 2: Try sending a simple message
    console.log('Testing message generation...');
    const response = await geminiSimplifiedService.getCompletion(
      'Say hello and tell me today\'s date in a single sentence.',
      { temperature: 0.2 }
    );
    
    const messageTest = {
      success: response.length > 0 && !response.startsWith('Error:'),
      message: response.length > 100 ? `${response.substring(0, 100)}...` : response
    };
    
    console.log('Message test result:', messageTest);
    
    return {
      success: connectionTest.success && messageTest.success,
      connectionTest,
      messageTest
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

// Run the test automatically in development mode
if (import.meta.env.DEV) {
  console.log('Development environment detected, running Gemini service test...');
  testGeminiService()
    .then(result => {
      console.log('Gemini service test completed:', result);
    })
    .catch(error => {
      console.error('Gemini service test failed:', error);
    });
} else {
  console.log('Production environment detected, skipping automatic Gemini service test.');
} 