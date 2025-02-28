import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { EmailProvider } from './contexts/EmailContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { AIAssistantPage } from './pages/AIAssistant';
import { SettingsPage } from './pages/SettingsPage';
import { CyberpunkEffects } from './components/ui/CyberpunkEffects';
import { useTheme } from './contexts/ThemeContext';
import { ToastContainer } from './components/ui/Toast';
import { AIAgentPage } from './pages/AIAgent';

function AppContent() {
  const { currentTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-200">
      {/* Only show effects for themes that enable them */}
      {currentTheme.effects && (
        <CyberpunkEffects
          mode={currentTheme.id === 'cyberpunk' ? 'normal' : undefined}
          theme={currentTheme.id}
          className="opacity-50"
        />
      )}
      
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/agents" element={<AIAgentPage />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <EmailProvider>
        <AppContent />
      </EmailProvider>
    </ThemeProvider>
  );
}