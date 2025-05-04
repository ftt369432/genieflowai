import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export const ToolsPage = () => {
  // State for Interview Wizard
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [interviewResponse, setInterviewResponse] = useState('');
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  
  // State for Image Generator
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Function for generating AI assistant improvement suggestions
  const generateInterviewResponse = async () => {
    if (!interviewQuestion.trim()) return;
    
    setIsGeneratingInterview(true);
    
    try {
      // Simulated API call
      // In production, replace with actual API call to your backend or AI service
      setTimeout(() => {
        const mockResponses = [
          "Based on the AI assistant you're building, I recommend enhancing the contextual understanding by providing more domain-specific examples in your training dataset. This will help the assistant recognize industry terminology more effectively.",
          "Consider implementing a feedback loop mechanism where user interactions can be used to continuously improve your AI assistant. This will help refine responses based on real user needs and questions.",
          "For the type of assistant you're building, I recommend focusing on conversational continuity. Implement state management to help the AI remember previous parts of the conversation for more cohesive interactions.",
          "To maximize your assistant's effectiveness, consider implementing sentiment analysis to detect user frustration or confusion, allowing your assistant to adapt its tone and response approach accordingly.",
        ];
        
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setInterviewResponse(randomResponse);
        setIsGeneratingInterview(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setInterviewResponse('An error occurred. Please try again.');
      setIsGeneratingInterview(false);
    }
  };

  // Mock function for generating images
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    
    try {
      // Simulated API call
      // In production, replace with actual API call to your backend or AI image generation service
      setTimeout(() => {
        // Using a placeholder image
        const placeholderImageUrl = `https://source.unsplash.com/random/400x300/?${encodeURIComponent(imagePrompt)}`;
        setGeneratedImageUrl(placeholderImageUrl);
        setIsGeneratingImage(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating image:', error);
      setGeneratedImageUrl('');
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Productivity Tools</h1>
      <p className="text-muted-foreground">Enhance your productivity with these specialized AI tools</p>
      
      <Tabs defaultValue="interview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interview">Interview Wizard</TabsTrigger>
          <TabsTrigger value="image">Image Generator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interview" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">AI Assistant Improvement Wizard</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Describe your AI assistant's purpose and current capabilities. The wizard will provide suggestions to maximize its effectiveness and help with training.
            </p>
            
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                rows={4}
                placeholder="Describe your AI assistant's purpose, target users, and current capabilities..."
                value={interviewQuestion}
                onChange={(e) => setInterviewQuestion(e.target.value)}
              ></textarea>
              
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                onClick={generateInterviewResponse}
                disabled={isGeneratingInterview || !interviewQuestion.trim()}
              >
                {isGeneratingInterview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating Suggestions...
                  </>
                ) : (
                  'Get Improvement Suggestions'
                )}
              </button>
              
              {interviewResponse && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Improvement Suggestions:</h4>
                  <p className="text-gray-700 dark:text-gray-200">{interviewResponse}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Image Generator</CardTitle>
              <CardDescription>
                Create images from text descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate, e.g., 'A serene mountain lake at sunset'"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              {generatedImageUrl && (
                <div className="mt-4 flex justify-center">
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated" 
                    className="rounded-md max-h-64 object-contain"
                    onError={() => setGeneratedImageUrl('')}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
              >
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolsPage;