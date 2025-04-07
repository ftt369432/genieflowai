import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider, EmailProvider, NotificationProvider, AIProvider } from './contexts';
import { useSupabase } from './providers/SupabaseProvider';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { EmailInboxPage } from './pages/EmailInboxPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AIPage } from './pages/AIPage';
import { CalendarPage } from './pages/CalendarPage';
import { ContactsPage } from './pages/ContactsPage';
import { TasksPage } from './pages/TasksPage';
import { LegalDocumentPage } from './pages/LegalDocumentPage';
import { NotebooksPage } from './pages/NotebooksPage';
import { EmailPage } from './pages/EmailPage';
import { AIDrivePage } from './pages/AIDrive';
import { AIAssistantPage } from './pages/AIAssistant';
import { TeamsPage } from './pages/TeamsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { GenieDrivePage } from './pages/GenieDrivePage';
import { AuthCallback } from './pages/AuthCallback';
import { AgentsPageComponent } from './pages/AgentsPage';
import { AgentDetail } from './pages/AgentDetail';
import { AgentWizardPage } from './pages/AgentWizardPage';
import { AutomationPage } from './pages/AutomationPage';
import { LoadingExample } from './components/examples/LoadingExample';
import { AutomationAuditDashboard } from './components/dashboard/AutomationAuditDashboard';

// ProtectedRoute component that redirects to login if user is not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSupabase();
  const [checkedSession, setCheckedSession] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only perform the check once loading is complete
    if (!loading) {
      console.log('ProtectedRoute check:', { user, loading });
      
      if (user) {
        console.log('ProtectedRoute: User authenticated, rendering protected content');
        setCheckedSession(true);
      } else {
        // Don't redirect if we're already on the login page or callback
        const isAuthPath = location.pathname === '/login' || 
                          location.pathname === '/auth/callback' || 
                          location.pathname === '/register';
        
        if (!isAuthPath) {
          console.log('ProtectedRoute: No user found, redirecting to login');
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

function App() {
  return (
    <Router>
      <AIProvider>
        <Routes>
          {/* Public routes with conditional redirect */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/examples/loading" element={<LoadingExample />} />
          
          {/* Auth callback route */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Agents routes - add these */}
          <Route 
            path="/agents" 
            element={
              <ProtectedRoute>
                <AgentsPageComponent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents/:agentId" 
            element={
              <ProtectedRoute>
                <AgentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agent-wizard" 
            element={
              <ProtectedRoute>
                <AgentWizardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/automation" 
            element={
              <ProtectedRoute>
                <AutomationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/audit" 
            element={
              <ProtectedRoute>
                <AutomationAuditDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect from authenticated root to dashboard */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription" 
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/email/*" 
            element={
              <ProtectedRoute>
                <EmailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai" 
            element={
              <ProtectedRoute>
                <AIPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assistant" 
            element={
              <ProtectedRoute>
                <AIAssistantPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/drive/*"
            element={
              <ProtectedRoute>
                <GenieDrivePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contacts" 
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Add the legal document route */}
          <Route path="/documents" element={
            <ProtectedRoute>
              <AppLayout>
                <LegalDocumentPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Add the notebooks route */}
          <Route 
            path="/notebooks" 
            element={
              <ProtectedRoute>
                <NotebooksPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Add the teams route */}
          <Route 
            path="/teams" 
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Add the projects route */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AIProvider>
    </Router>
  );
}

export default App;