import * as React from 'react';
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider, EmailProvider, NotificationProvider, AIProvider, TeamProvider } from './contexts';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSupabase } from './providers/SupabaseProvider';
import routerConfig from './router/config';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import AuthLayout from './components/layout/AuthLayout';
import { FullPageSpinner } from './components/ui/Spinner';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // Temporarily commented out
import { Toaster as SonnerToaster } from "sonner";

const queryClient = new QueryClient();

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage'));
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
const EmailDetailPage = lazy(() => import('./pages/EmailDetailPage'));
const GenieDrivePage = lazy(() => import('./pages/GenieDrivePage').then(module => ({ default: module.GenieDrivePage })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistant').then(module => ({ default: module.AIAssistantPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(module => ({ default: module.TeamsPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(module => ({ default: module.ProjectsPage })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(module => ({ default: module.AuthCallback })));
const AgentWizardPage = lazy(() => import('./pages/AgentWizardPage').then(module => ({ default: module.AgentWizardPage })));
const AutomationPage = lazy(() => import('./pages/AutomationPage').then(module => ({ default: module.AutomationPage })));
const LoadingExample = lazy(() => import('./components/examples/LoadingExample').then(module => ({ default: module.LoadingExample })));
const AutomationAuditDashboard = lazy(() => import('./components/dashboard/AutomationAuditDashboard').then(module => ({ default: module.AutomationAuditDashboard })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const AssistantsPage = lazy(() => import('./pages/AssistantsPage').then(module => ({ default: module.AssistantsPage })));
const ConfigureSwarmPage = lazy(() => import('./pages/ConfigureSwarmPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then(module => ({ default: module.KnowledgeBasePage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const WorkflowEditorPage = lazy(() => import('./pages/WorkflowEditorPage'));
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'));
const DataSourceDetailPage = lazy(() => import('./pages/DataSourceDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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

  // If we have a user render the children, otherwise, null (or redirect handled by effect)
  return user ? <>{children}</> : null;
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen"><FullPageSpinner size="xl" /></div>}>
              <EmailProvider>
                <NotificationProvider>
                  <AIProvider>
                    <Routes>
                      <Route path="/auth/*" element={<AuthRoutes />} />
                      <Route path="/*" element={<ProtectedAppRoutes />} />
                    </Routes>
                  </AIProvider>
                </NotificationProvider>
              </EmailProvider>
            </Suspense>
            <SonnerToaster position="bottom-right" />
          </Router>
        </AuthProvider>
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

const AuthRoutes = () => (
  <AuthLayout>
    <Routes>
      <Route path="login" element={<LoginPage />} />
      {/* <Route path="signup" element={<SignupPage />} /> */}
      {/* <Route path="forgot-password" element={<ForgotPasswordPage />} /> */}
      {/* <Route path="reset-password" element={<ResetPasswordPage />} /> */}
      {/* <Route path="verify-otp" element={<VerifyOtpPage />} /> */}
      {/* <Route path="*" element={<Navigate to="/auth/login" replace />} /> */}
    </Routes>
  </AuthLayout>
);

const ProtectedAppRoutes = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen w-screen"><FullPageSpinner size="xl" /></div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return (
    <TeamProvider>
      <EmailProvider>
        <NotificationProvider>
          <AIProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/automation" element={<ProtectedRoute><AutomationPage /></ProtectedRoute>} />
                <Route path="/email" element={<ProtectedRoute><EmailPage /></ProtectedRoute>} />
                <Route path="/email/:emailId" element={<ProtectedRoute><EmailDetailPage /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/drive" element={<ProtectedRoute><GenieDrivePage /></ProtectedRoute>} />
                <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
                <Route path="/ai-assistant/*" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
                <Route path="/workflow-editor/:workflowId" element={<ProtectedRoute><WorkflowEditorPage /></ProtectedRoute>} />
                <Route path="/workflow-editor" element={<ProtectedRoute><WorkflowEditorPage /></ProtectedRoute>} />
                <Route path="/data-sources" element={<ProtectedRoute><DataSourcesPage /></ProtectedRoute>} />
                <Route path="/data-sources/:sourceId" element={<ProtectedRoute><DataSourceDetailPage /></ProtectedRoute>} />
                <Route path="/agent-wizard" element={<ProtectedRoute><AgentWizardPage /></ProtectedRoute>} />
                <Route path="/configure-swarm" element={<ProtectedRoute><ConfigureSwarmPage /></ProtectedRoute>} />
                <Route path="/configure-swarm/:templateId" element={<ProtectedRoute><ConfigureSwarmPage /></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
                <Route path="/teams/:teamId" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
                <Route path="/teams/:teamId/:pageId" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/admin/*" element={<AdminPage />} />
                <Route path="/assistants" element={<ProtectedRoute><AssistantsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </AppLayout>
          </AIProvider>
        </NotificationProvider>
      </EmailProvider>
    </TeamProvider>
  );
};

export default App;