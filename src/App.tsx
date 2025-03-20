import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { EmailProvider } from './contexts/EmailContext';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { AIAssistantPage } from './pages/AIAssistant';
import { SettingsPage } from './pages/SettingsPage';
import { CyberpunkEffects } from './components/ui/CyberpunkEffects';
import { AIAgentPage } from './pages/AIAgent';
import { AppLayout } from './components/layout/AppLayout';

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-200">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/assistant" element={<AIAssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/agent" element={<AIAgentPage />} />
        </Routes>
      </Layout>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <EmailProvider>
          <AppContent />
          <Toaster position="top-right" />
        </EmailProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}