import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useServices } from './hooks/useServices';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { EmailProvider } from './contexts/EmailContext';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { AIAgentsPage } from './pages/AgentsPage';
import { AgentDetail } from './pages/AgentDetail';
import { EmailPage } from './pages/EmailPage';
import { AIDrivePage } from './pages/AIDrivePage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GoogleCallback } from './pages/auth/GoogleCallback';
import { GoogleAuthCallback } from './components/auth/GoogleAuthCallback';
import { AIAssistantPage } from './pages/AIAssistant';
import type { ReactNode } from 'react';

export function App() {
  const { voiceControl } = useServices();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (voiceControl) {
      // Update listening state when voice control changes
      const interval = setInterval(() => {
        setIsListening(voiceControl.isVoiceEnabled());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [voiceControl]);

  const toggleVoiceControl = () => {
    if (voiceControl) {
      if (isListening) {
        voiceControl.stopListening();
      } else {
        voiceControl.setEnabled(true);
        voiceControl.startListening();
      }
      setIsListening(!isListening);
    }
  };

  return (
    <ThemeProvider>
      <EmailProvider>
        <div className="min-h-screen bg-background text-text-primary transition-colors duration-200 relative">
          <div className="fixed bottom-4 right-4 z-50">
            {voiceControl && (
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-full bg-background shadow-lg hover:bg-gray-100"
                  onClick={toggleVoiceControl}
                >
                  <span className={`block w-3 h-3 rounded-full ${isListening ? 'bg-red-500' : 'bg-gray-400'}`} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col min-h-screen">
            <Layout>
              <Routes>
                <Route path="/" Component={Dashboard} />
                <Route path="/tasks" Component={TasksPage} />
                <Route path="/calendar" Component={CalendarPage} />
                <Route path="/agents" Component={AIAgentsPage} />
                <Route path="/agents/:agentId" Component={AgentDetail} />
                <Route path="/email" Component={EmailPage} />
                <Route path="/drive" Component={AIDrivePage} />
                <Route path="/knowledge" Component={KnowledgeBasePage} />
                <Route path="/analytics" Component={AnalyticsPage} />
                <Route path="/settings" Component={SettingsPage} />
                <Route path="/ai-assistant" Component={AIAssistantPage} />
                <Route path="/auth/google/callback" Component={GoogleCallback} />
                <Route path="/auth/callback" element={<GoogleAuthCallback />} />
              </Routes>
            </Layout>
          </div>
        </div>
      </EmailProvider>
    </ThemeProvider>
  );
}