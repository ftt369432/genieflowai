import axios from 'axios';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

const getCompletion = async (prompt, options = {}) => {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    topK = 40,
    topP = 0.95
  } = options;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${geminiApiKey}`,
      {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature,
          topK,
          topP,
          maxOutputTokens: maxTokens,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }
    );

    if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw error;
  }
};

export const getGeminiResponse = getCompletion;

// Export the geminiService object to match the import in assistantConversationService.ts
export const geminiService = {
  getCompletion
};