import React from 'react';
import ReactDOM from 'react-dom/client';
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

// Create a context for services
export const ServicesContext = React.createContext(services);

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Create root
const root = ReactDOM.createRoot(rootElement);

// Render app
root.render(
  <React.StrictMode>
    <ServicesContext.Provider value={services}>
      <ThemeProvider>
        <NotificationProvider>
          <SupabaseProvider>
            <AuthProvider>
              <EmailProvider>
                <CalendarProvider>
                  <DndProvider backend={HTML5Backend}>
                    <App />
                    <Toaster />
                  </DndProvider>
                </CalendarProvider>
              </EmailProvider>
            </AuthProvider>
          </SupabaseProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ServicesContext.Provider>
  </React.StrictMode>
);
