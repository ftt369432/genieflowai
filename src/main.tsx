import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './index.css';
// Import CSS directly since @import isn't working
import './styles/globals.css';
import './styles/grid-layout.css';
import './styles/grid-styles.css';
import './styles/grid-fixed.css';
import './styles/date-picker.css';
import './styles/vendor.css';
import './styles/test.css';
import { Toaster } from 'sonner';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { ThemeProvider, NotificationProvider } from './contexts';
import { EmailProvider } from './contexts/EmailContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { services } from './services/core/initializeServices';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { ToastProvider } from './contexts/ToastContext';
import { TeamProvider } from './contexts/TeamContext';

// Create a context for services
export const ServicesContext = React.createContext(services);

// Ensure single React instance
if (typeof window !== 'undefined') {
  window.React = React;
}

// Create the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServicesContext.Provider value={services}>
        <ThemeProvider>
          <NotificationProvider>
            <SupabaseProvider>
              <AuthProvider>
                <EmailProvider>
                  <CalendarProvider>
                    <TeamProvider>
                      <DndProvider backend={HTML5Backend}>
                        <ModalProvider>
                          <ToastProvider>
                            <App />
                            <Toaster />
                          </ToastProvider>
                        </ModalProvider>
                      </DndProvider>
                    </TeamProvider>
                  </CalendarProvider>
                </EmailProvider>
              </AuthProvider>
            </SupabaseProvider>
          </NotificationProvider>
        </ThemeProvider>
      </ServicesContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
