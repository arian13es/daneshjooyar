/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import './utils/polyfills';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
// NOTE: the Vazirmatn font is loaded from /fonts/vazirmatn.woff2, which is
// preloaded in index.html and declared with @font-face there and in index.css.
// @fontsource-variable/vazirmatn was removed because it shipped three extra
// subset files (latin + latin-ext) and declared the same family again, so the
// winning @font-face was ambiguous.
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
(window as any).__APP_MOUNTED__ = true;

