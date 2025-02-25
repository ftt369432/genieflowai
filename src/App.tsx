import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useServices } from './hooks/useServices';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { MicrophoneControl } from './components/ui/MicrophoneControl';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { AIAgentsPage } from './pages/AgentsPage';
import { AgentDetail } from './pages/AgentDetail';
import { EmailPage } from './pages/EmailPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIDrivePage } from './pages/AIDrivePage';

export function App() {
  const { voiceControl } = useServices();

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-text-primary transition-colors duration-200 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-paper opacity-50" />
        <div className="relative z-10">
          <Layout>
            <div className="fixed top-4 right-4 z-50">
              <MicrophoneControl
                onStart={voiceControl.startListening}
                onStop={voiceControl.stopListening}
              />
            </div>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/agents" element={<AIAgentsPage />} />
              <Route path="/agents/:agentId" element={<AgentDetail />} />
              <Route path="/email" element={<EmailPage />} />
              <Route path="/drive" element={<AIDrivePage />} />
              <Route path="/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </div>
      </div>
    </ThemeProvider>
  );
}