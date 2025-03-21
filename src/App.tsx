import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { AIDrivePage } from './pages/AIDrive';
import EmailSettingsPage from './pages/EmailSettings';
import { LoginPage } from './pages/Login';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { useSupabase } from './providers/SupabaseProvider';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return user ? <>{children}</> : null;
}

function AppContent() {
  const { currentTheme } = useTheme();
  const { user } = useSupabase();
  
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
      
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout>
              <CalendarPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Layout>
              <TasksPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/ai-assistant" element={
          <ProtectedRoute>
            <Layout>
              <AIAssistantPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/agents" element={
          <ProtectedRoute>
            <Layout>
              <AIAgentPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/email" element={
          <ProtectedRoute>
            <Layout>
              <EmailSettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/drive" element={
          <ProtectedRoute>
            <Layout>
              <AIDrivePage />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <SupabaseProvider>
      <ThemeProvider>
        <EmailProvider>
          <AppContent />
        </EmailProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}