import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider, EmailProvider, NotificationProvider, AIProvider, TeamProvider } from './contexts';
import { AuthProvider } from './contexts/AuthContext';
import { useSupabase } from './providers/SupabaseProvider';
import routerConfig from './router/config';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(module => ({ default: module.SubscriptionPage })));
const EmailInboxPage = lazy(() => import('./pages/EmailInboxPage').then(module => ({ default: module.EmailInboxPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const AIPage = lazy(() => import('./pages/AIPage').then(module => ({ default: module.AIPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(module => ({ default: module.CalendarPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then(module => ({ default: module.ContactsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(module => ({ default: module.TasksPage })));
const LegalDocumentPage = lazy(() => import('./pages/LegalDocumentPage').then(module => ({ default: module.LegalDocumentPage })));
const NotebooksPage = lazy(() => import('./pages/NotebooksPage').then(module => ({ default: module.NotebooksPage })));
const EmailPage = lazy(() => import('./pages/EmailPage').then(module => ({ default: module.EmailPage })));
const AIDrivePage = lazy(() => import('./pages/AIDrive').then(module => ({ default: module.AIDrivePage })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistant').then(module => ({ default: module.AIAssistantPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(module => ({ default: module.TeamsPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(module => ({ default: module.ProjectsPage })));
const GenieDrivePage = lazy(() => import('./pages/GenieDrivePage').then(module => ({ default: module.GenieDrivePage })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(module => ({ default: module.AuthCallback })));
const AgentsPageComponent = lazy(() => import('./pages/AgentsPage').then(module => ({ default: module.AgentsPageComponent })));
const AgentDetail = lazy(() => import('./pages/AgentDetail').then(module => ({ default: module.AgentDetail })));
const AgentWizardPage = lazy(() => import('./pages/AgentWizardPage').then(module => ({ default: module.AgentWizardPage })));
const AutomationPage = lazy(() => import('./pages/AutomationPage').then(module => ({ default: module.AutomationPage })));
const LoadingExample = lazy(() => import('./components/examples/LoadingExample').then(module => ({ default: module.LoadingExample })));
const AutomationAuditDashboard = lazy(() => import('./components/dashboard/AutomationAuditDashboard').then(module => ({ default: module.AutomationAuditDashboard })));
const GmailConnectionTest = lazy(() => import('./pages/GmailConnectionTest').then(module => ({ default: module.GmailConnectionTest })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const AssistantsPage = lazy(() => import('./pages/AssistantsPage').then(module => ({ default: module.AssistantsPage })));

// Create a loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full">
    {typeof LoadingSpinner !== 'undefined' ? <LoadingSpinner /> : <div>Loading...</div>}
  </div>
);

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
    <Router future={routerConfig.future}>
      <AIProvider>
        <AuthProvider>
          <TeamProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes with conditional redirect */}
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/examples/loading" element={<LoadingExample />} />
                
                {/* Auth callback route */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Gmail connection test route */}
                <Route 
                  path="/gmail-test" 
                  element={
                    <ProtectedRoute>
                      <GmailConnectionTest />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Agents routes */}
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

                {/* Email Settings Route */}
                <Route 
                  path="/email-settings" 
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
                  path="/assistants" 
                  element={
                    <ProtectedRoute>
                      <EmailProvider>
                        <NotificationProvider>
                          <ThemeProvider>
                            <AssistantsPage />
                          </ThemeProvider>
                        </NotificationProvider>
                      </EmailProvider>
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
                
                {/* Settings route */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </TeamProvider>
        </AuthProvider>
      </AIProvider>
    </Router>
  );
}

export default App;