import React from 'react';
import { AgentChat } from '../components/agents/AgentChat';
import { CreateAgentExample } from '../components/agents/CreateAgentExample';
import { FeatureTest } from '../components/test/FeatureTest';

export function TestAI() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">AI Test Page</h1>
      
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chat Test</h2>
        <AgentChat />
      </section>

      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Agent Creation</h2>
        <CreateAgentExample />
      </section>

      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Tests</h2>
        <FeatureTest />
      </section>
    </div>
  );
} 