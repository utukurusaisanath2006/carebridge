import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Global window error and unhandledrejection loggers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Care Bridge Global Error]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Care Bridge Unhandled Rejection]:', event.reason);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>
);

