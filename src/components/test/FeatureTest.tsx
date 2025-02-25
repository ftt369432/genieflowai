import React, { useState } from 'react';
import { AIServiceFactory } from '../../services/ai/aiServiceFactory';
import { useAgentStore } from '../../store/agentStore';

export function FeatureTest() {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const aiService = AIServiceFactory.getInstance();
  const agents = useAgentStore(state => state.agents);

  const testFeatures = async () => {
    setIsLoading(true);
    try {
      // Test basic completion
      const completion = await aiService.getCompletion(
        "Summarize the capabilities of an AI assistant in one sentence.",
        { temperature: 0.7 }
      );
      
      // Test embedding
      const embedding = await aiService.getEmbedding("Test embedding generation");
      
      setResult(`
        Completion test: ${completion}
        
        Embedding generated: ${embedding.slice(0, 5).join(', ')}...
        
        Active Agents: ${agents.length}
      `);
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={testFeatures}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Features'}
      </button>

      {result && (
        <pre className="p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
} 