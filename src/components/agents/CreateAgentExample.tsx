import React from 'react';
import { useAgentStore } from '../../store/agentStore';

export function CreateAgentExample() {
  const createAgent = useAgentStore(state => state.createAgent);

  const handleCreateAgent = async () => {
    try {
      await createAgent({
        name: "Email Assistant",
        type: "email",
        capabilities: ["email-processing", "scheduling", "drafting"],
        config: {
          modelName: "gpt-4-turbo-preview",
          maxTokens: 1000,
          temperature: 0.7,
          basePrompt: "You are an expert email assistant..."
        }
      });
      alert("Agent created successfully!");
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("Failed to create agent");
    }
  };

  return (
    <button
      onClick={handleCreateAgent}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Create Email Assistant
    </button>
  );
} 