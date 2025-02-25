import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';

export function AgentChat() {
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`p-3 rounded ${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            {msg}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Ask me anything..."
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
} 