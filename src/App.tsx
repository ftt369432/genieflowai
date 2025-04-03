import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider, EmailProvider, NotificationProvider, AIProvider } from './contexts';
import { useSupabase } from './providers/SupabaseProvider';
import { 
  HomePage, 
  LoginPage, 
  ProfilePage, 
  SubscriptionPage, 
  EmailInboxPage,
  NotificationsPage,
  DashboardPage,
  AIPage,
  CalendarPage,
  ContactsPage,
  TasksPage,
  LegalDocumentPage,
  NotebooksPage
} from './pages';
import { AIDrivePage } from './pages/AIDrive';
import { LoadingExample } from './components/examples/LoadingExample';
import { AIAssistantPage } from './pages/AIAssistant';
import { TeamsPage } from './pages/TeamsPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSupabase();
  
  console.log("ProtectedRoute check:", { user, loading });
  
  // Show a loading state while checking authentication
  if (loading) {
    console.log("ProtectedRoute: Still loading authentication state");
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering protected content");
  return <AppLayout>{children}</AppLayout>;
};

// Home route that redirects to dashboard if authenticated
const HomeRoute = () => {
  const { user, loading } = useSupabase();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    console.log("User is authenticated, redirecting to dashboard");
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
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
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
                <EmailInboxPage />
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
            path="/drive" 
            element={
              <ProtectedRoute>
                <AIDrivePage />
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
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AIProvider>
    </Router>
  );
}

export default App;