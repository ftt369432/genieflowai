import React from 'react';
import { AppRoutes } from './routes';
import { SupabaseProvider } from './providers/SupabaseProvider';

/**
 * Main Application entry point
 * All routing is now handled in the routes/index.tsx file
 */
function App() {
  return (
    <SupabaseProvider>
      <AppRoutes />
    </SupabaseProvider>
  );
}

export default App;