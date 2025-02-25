import React from 'react';
import { useServices } from '../hooks/useServices';

export function SettingsPage() {
  const { aiAssistant, voiceControl } = useServices();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid gap-8">
        {/* AI Assistant Settings */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
          <div className="space-y-4">
            {/* Add AI Assistant settings controls here */}
          </div>
        </section>

        {/* Voice Control Settings */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Voice Control</h2>
          <div className="space-y-4">
            {/* Add Voice Control settings controls here */}
          </div>
        </section>

        {/* Workflow Settings */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Workflow</h2>
          <div className="space-y-4">
            {/* Add Workflow settings controls here */}
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            {/* Add Appearance settings controls here */}
          </div>
        </section>
      </div>
    </div>
  );
} 