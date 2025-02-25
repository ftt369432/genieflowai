import React from 'react';
import { Card } from '../ui/Card';

export function WelcomeWidget() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-2">{greeting}! 👋</h2>
      <p className="text-gray-600">
        Welcome to your AI-powered workspace. Access your documents, chat with AI, and manage your tasks all in one place.
      </p>
    </Card>
  );
} 