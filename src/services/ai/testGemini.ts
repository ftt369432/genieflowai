import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiKey() {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('Testing API key:', apiKey);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log('Attempting to list models...');
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    const text = response.text();
    
    console.log('Success! Response:', text);
    return true;
  } catch (error) {
    console.error('API Key test failed:', error);
    return false;
  }
}

// Run the test
testGeminiKey().then(success => {
  console.log('Key test completed. Working:', success);
});

export { testGeminiKey }; 