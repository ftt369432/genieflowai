import React, { useEffect, useState } from 'react';
import { 
  Navigate, 
  useNavigate, 
  useLocation, 
  useParams,
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
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
import { TaskPage } from './pages/TaskPage';
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
import { GmailConnectionTest } from './pages/GmailConnectionTest';
import { Settings } from './pages/Settings';
import EmailConnectSuccess from './pages/EmailConnectSuccess';
import EmailConnectError from './pages/EmailConnectError';
import EmailBypass from './pages/EmailBypass';
import { EmailTestPage } from './pages/EmailTest';
import { AssistantsPage } from './pages/AssistantsPage';
import DocumentsPage from './pages/DocumentsPage';
import { AssistantChat } from './components/assistants/AssistantChat';
import { useAssistantStore } from './store/assistantStore';
import LegalSwarmPage from './pages/LegalSwarmPage';
import { redirectToLocalhost } from './utils/devRedirect';

// ProtectedRoute wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const isAuthPath = location.pathname === '/login' || 
                        location.pathname === '/auth/callback' || 
                        location.pathname === '/register';
      
      if (!isAuthPath) {
        console.log('ProtectedRoute: No user found, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return user ? <AppLayout>{children}</AppLayout> : null;
};

// Home route component
const HomeRoute = () => {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      console.log("User is authenticated at root path, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return <HomePage />;
};

// Login route component
const LoginRoute = () => {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && user) {
      console.log("User is authenticated, redirecting to dashboard from login page");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return <LoginPage />;
};

// Specialized Assistant route component
const SpecializedAssistantRoute = ({ assistantType }: { assistantType: string }) => {
  const { assistants, addTemplateAssistants } = useAssistantStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    addTemplateAssistants();
    setLoading(false);
  }, [addTemplateAssistants]);

  useEffect(() => {
    if (!loading) {
      const assistant = assistants.find(a => 
        a.name.toLowerCase().includes(assistantType.toLowerCase())
      );
      
      if (!assistant) {
        console.error(`No assistant found with type: ${assistantType}`);
        navigate('/assistants', { replace: true });
      }
    }
  }, [assistants, assistantType, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading assistant...</div>;
  }

  const assistant = assistants.find(a => 
    a.name.toLowerCase().includes(assistantType.toLowerCase())
  );

  if (!assistant) {
    return null; // Navigate is handled in useEffect
  }

  return (
    <ProtectedRoute>
      <div className="h-full">
        <AssistantChat assistant={assistant} onBack={() => navigate('/assistants')} />
      </div>
    </ProtectedRoute>
  );
};

// Create router with React Router v7
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />
  },
  {
    path: "/login",
    element: <LoginRoute />
  },
  {
    path: "/examples/loading",
    element: <LoadingExample />
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />
  },
  {
    path: "/gmail-test",
    element: <ProtectedRoute><GmailConnectionTest /></ProtectedRoute>
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>
  },
  {
    path: "/agents",
    element: <ProtectedRoute><AgentsPageComponent /></ProtectedRoute>
  },
  {
    path: "/agents/create",
    element: <ProtectedRoute><AgentWizardPage /></ProtectedRoute>
  },
  {
    path: "/agent/:id",
    element: <ProtectedRoute><AgentDetail /></ProtectedRoute>
  },
  {
    path: "/calendar",
    element: <ProtectedRoute><CalendarPage /></ProtectedRoute>
  },
  // Email route structure - Fixed to resolve conflicts
  {
    path: "/email",
    children: [
      {
        index: true,
        element: <ProtectedRoute><EmailInboxPage /></ProtectedRoute>
      },
      {
        path: "connect/success",
        element: <EmailConnectSuccess />
      },
      {
        path: "connect/error",
        element: <EmailConnectError />
      },
      {
        path: "bypass",
        element: <EmailBypass />
      },
      {
        path: ":id",
        element: <ProtectedRoute><EmailPage /></ProtectedRoute>
      }
    ]
  },
  {
    path: "/email-test",
    element: <ProtectedRoute><EmailTestPage /></ProtectedRoute>
  },
  {
    path: "/tasks",
    element: <ProtectedRoute><TasksPage /></ProtectedRoute>
  },
  {
    path: "/task/:id",
    element: <ProtectedRoute><TaskPage /></ProtectedRoute>
  },
  {
    path: "/profile",
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
  },
  {
    path: "/settings",
    element: <ProtectedRoute><Settings /></ProtectedRoute>
  },
  {
    path: "/subscription",
    element: <ProtectedRoute><SubscriptionPage /></ProtectedRoute>
  },
  {
    path: "/ai",
    element: <ProtectedRoute><AIPage /></ProtectedRoute>
  },
  {
    path: "/ai-drive",
    element: <ProtectedRoute><AIDrivePage /></ProtectedRoute>
  },
  {
    path: "/ai-assistant",
    element: <ProtectedRoute><AIAssistantPage /></ProtectedRoute>
  },
  // Replace redirect with proper component
  {
    path: "/assistant",
    element: <ProtectedRoute><AIAssistantPage useAssistantIntegration={true} /></ProtectedRoute>
  },
  {
    path: "/assistants",
    element: <ProtectedRoute><AssistantsPage /></ProtectedRoute>
  },
  {
    path: "/contacts",
    element: <ProtectedRoute><ContactsPage /></ProtectedRoute>
  },
  {
    path: "/legal-swarm",
    element: <ProtectedRoute><LegalSwarmPage /></ProtectedRoute>
  },
  {
    path: "/legal-document/:id",
    element: <ProtectedRoute><LegalDocumentPage /></ProtectedRoute>
  },
  {
    path: "/notebooks",
    element: <ProtectedRoute><NotebooksPage /></ProtectedRoute>
  },
  {
    path: "/notifications",
    element: <ProtectedRoute><NotificationsPage /></ProtectedRoute>
  },
  {
    path: "/teams",
    element: <ProtectedRoute><TeamsPage /></ProtectedRoute>
  },
  {
    path: "/projects",
    element: <ProtectedRoute><ProjectsPage /></ProtectedRoute>
  },
  {
    path: "/drive",
    element: <ProtectedRoute><GenieDrivePage /></ProtectedRoute>
  },
  {
    path: "/documents",
    element: <ProtectedRoute><DocumentsPage /></ProtectedRoute>
  },
  {
    path: "/automation",
    element: <ProtectedRoute><AutomationPage /></ProtectedRoute>
  },
  {
    path: "/automation/audit",
    element: <ProtectedRoute><AutomationAuditDashboard /></ProtectedRoute>
  },
  {
    path: "/legal-assistant",
    element: <SpecializedAssistantRoute assistantType="legal" />
  },
  {
    path: "/writing-assistant",
    element: <SpecializedAssistantRoute assistantType="writing" />
  },
  {
    path: "/email-assistant",
    element: <SpecializedAssistantRoute assistantType="email" />
  },
  {
    path: "/calendar-assistant",
    element: <SpecializedAssistantRoute assistantType="calendar" />
  },
  {
    path: "/research-assistant",
    element: <SpecializedAssistantRoute assistantType="research" />
  },
  // Add a catch-all 404 route
  {
    path: "*",
    element: <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
} as any);

function App() {
  // Add an effect to check for Netlify and redirect if needed
  useEffect(() => {
    // Check if we're accidentally using Netlify in dev mode
    redirectToLocalhost();
    
    // Enable dev mode by default in development
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      localStorage.setItem('devMode', 'true');
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default App;