import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign Vite HMR websocket connection errors from showing up as intrusive unhandled rejection overlays in the development iframe environment.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonStr = reason ? String(reason.message || reason) : '';
    if (reasonStr.includes('WebSocket') || reasonStr.includes('websocket') || reasonStr.includes('vite') || reasonStr.includes('HMR')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('vite') || msg.includes('HMR')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

