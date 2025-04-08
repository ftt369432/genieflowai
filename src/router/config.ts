import { UNSAFE_NavigationContext } from 'react-router-dom';

// Configure future flags for React Router v7 compatibility
export const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Export the configuration to be used in the router setup
export default routerConfig; 