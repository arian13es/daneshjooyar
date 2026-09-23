/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import '@fontsource-variable/vazirmatn';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error caught:", message, source, lineno, colno, error);
};
window.onunhandledrejection = function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
