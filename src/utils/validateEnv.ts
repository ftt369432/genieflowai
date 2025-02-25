export function validateEnv() {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log('Environment Check:');
  console.log('- VITE_GEMINI_API_KEY exists:', !!geminiKey);
  console.log('- VITE_GEMINI_API_KEY length:', geminiKey?.length);
  console.log('- First 4 chars:', geminiKey?.slice(0, 4));
  
  if (!geminiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not defined');
  }
  
  if (!geminiKey.startsWith('AIza')) {
    throw new Error('VITE_GEMINI_API_KEY appears to be invalid (should start with AIza)');
  }
  
  return {
    VITE_GEMINI_API_KEY: geminiKey
  };
} 