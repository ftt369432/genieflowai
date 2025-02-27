import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/vendor.css';
import './styles/grid-layout.css';
import './index.css';
import { services } from './services/core/initializeServices';

// Create a context for services
export const ServicesContext = React.createContext(services);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServicesContext.Provider value={services}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ServicesContext.Provider>
  </React.StrictMode>
);
