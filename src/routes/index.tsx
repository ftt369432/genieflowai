import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../providers/SupabaseProvider';
import { ModernLayout } from '../components/layout/ModernLayout';
import { AppLayout } from '../components/layout/AppLayout';

// Page imports
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AIPage } from '../pages/AIPage';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { AgentDetail } from '../pages/AgentDetail';
import { AIDrivePage } from '../pages/AIDrive';
import { AssistantsPage } from '../pages/AssistantsPage';
import { AgentsPageComponent } from '../pages/AgentsPage';
import { AgentWizardPage } from '../pages/AgentWizardPage';
import { NotebookPage } from '../pages/NotebookPage';
import { AutomationPage } from '../pages/AutomationPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { EmailPage } from '../pages/EmailPage';
import { EmailInboxPage } from '../pages/EmailInboxPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ContactsPage } from '../pages/ContactsPage';
import { TaskPage } from '../pages/TaskPage';
import DocumentsPage from '../pages/DocumentsPage';
import { NotebooksPage } from '../pages/NotebooksPage';
import { AIAssistantPage } from '../pages/AIAssistant';
import { TeamsPage } from '../pages/TeamsPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { GenieDrivePage } from '../pages/GenieDrivePage';
import { GmailConnectionTest } from '../pages/GmailConnectionTest';
import { EmailTestPage } from '../pages/EmailTest';
import EmailBypass from '../pages/EmailBypass';
import { AuthCallback } from '../pages/AuthCallback';
import { LoadingExample } from '../components/examples/LoadingExample';
import EmailConnectSuccess from '../pages/EmailConnectSuccess';
import EmailConnectError from '../pages/EmailConnectError';
import { AutomationAuditDashboard } from '../components/dashboard/AutomationAuditDashboard';
import { Settings } from '../pages/Settings';

// AuthGuard component that redirects to login if user is not authenticated
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSupabase();
  const [checkedSession, setCheckedSession] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only perform the check once loading is complete
    if (!loading) {
      console.log('AuthGuard check:', { user, loading });
      
      if (user) {
        console.log('AuthGuard: User authenticated, rendering protected content');
        setCheckedSession(true);
      } else {
        // Don't redirect if we're already on an auth path
        const isAuthPath = location.pathname === '/login' || 
                           location.pathname === '/auth/callback' || 
                           location.pathname === '/register';
        
        if (!isAuthPath) {
          console.log('AuthGuard: No user found, redirecting to login');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading state if still checking auth
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If we have a user or we're on an auth page, render the children
  return user ? <AppLayout>{children}</AppLayout> : null;
};

// Home route that redirects to dashboard if authenticated
const HomeRoute = () => {
  const { user, loading } = useSupabase();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Only redirect if we're at the exact root path
  if (user && location.pathname === '/') {
    console.log("User is authenticated at root path, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <HomePage />;
};

// Login route that redirects to dashboard when already logged in
const LoginRoute = () => {
  const { user, loading } = useSupabase();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    console.log("User is authenticated, redirecting to dashboard from login page");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LoginPage />;
};

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes with conditional redirect */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/examples/loading" element={<LoadingExample />} />
      
      {/* Auth callback route */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Email connection callback routes - must be outside of auth guard */}
      <Route path="/email/connect/success" element={<EmailConnectSuccess />} />
      <Route path="/email/connect/error" element={<EmailConnectError />} />
      
      {/* Gmail connection test route */}
      <Route path="/gmail-test" element={<AuthGuard><GmailConnectionTest /></AuthGuard>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="/dashboard/audit" element={<AuthGuard><AutomationAuditDashboard /></AuthGuard>} />
      
      {/* Profiles & Settings */}
      <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
      <Route path="/email-settings" element={<AuthGuard><ProfilePage /></AuthGuard>} />
      <Route path="/subscription" element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
      <Route path="/notifications" element={<AuthGuard><NotificationsPage /></AuthGuard>} />
      
      {/* AI & Assistants */}
      <Route path="/ai" element={<AuthGuard><AIPage /></AuthGuard>} />
      <Route path="/assistant" element={<AuthGuard><AIAssistantPage /></AuthGuard>} />
      <Route path="/assistants" element={<AuthGuard><AssistantsPage /></AuthGuard>} />
      <Route path="/assistants/legal" element={<AuthGuard><DocumentsPage /></AuthGuard>} />
      
      {/* Agents */}
      <Route path="/agents" element={<AuthGuard><AgentsPageComponent /></AuthGuard>} />
      <Route path="/agents/:agentId" element={<AuthGuard><AgentDetail /></AuthGuard>} />
      <Route path="/agent-wizard" element={<AuthGuard><AgentWizardPage /></AuthGuard>} />
      <Route path="/automation" element={<AuthGuard><AutomationPage /></AuthGuard>} />
      
      {/* Email */}
      <Route path="/email" element={<AuthGuard><EmailPage /></AuthGuard>} />
      <Route path="/email/connect" element={<AuthGuard><EmailConnectSuccess /></AuthGuard>} />
      <Route path="/email/inbox" element={<AuthGuard><EmailInboxPage /></AuthGuard>} />
      <Route path="/email/bypass" element={<AuthGuard><EmailBypass /></AuthGuard>} />
      <Route path="/email-test" element={<AuthGuard><EmailTestPage /></AuthGuard>} />
      
      {/* Productivity */}
      <Route path="/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
      <Route path="/contacts" element={<AuthGuard><ContactsPage /></AuthGuard>} />
      <Route path="/tasks" element={<AuthGuard><Navigate to="/tasks/board" replace /></AuthGuard>} />
      <Route path="/tasks/:viewType" element={<AuthGuard><TaskPage /></AuthGuard>} />
      
      {/* Content & Knowledge */}
      <Route path="/documents" element={<AuthGuard><DocumentsPage /></AuthGuard>} />
      <Route path="/notebooks" element={<AuthGuard><NotebooksPage /></AuthGuard>} />
      <Route path="/drive/*" element={<AuthGuard><GenieDrivePage /></AuthGuard>} />
      <Route path="/knowledge" element={<AuthGuard><KnowledgeBasePage /></AuthGuard>} />
      
      {/* Collaboration */}
      <Route path="/teams" element={<AuthGuard><TeamsPage /></AuthGuard>} />
      <Route path="/projects" element={<AuthGuard><ProjectsPage /></AuthGuard>} />
      <Route path="/analytics" element={<AuthGuard><AnalyticsPage /></AuthGuard>} />
      
      {/* Redirects */}
      <Route path="/app" element={<AuthGuard><Navigate to="/dashboard" replace /></AuthGuard>} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 