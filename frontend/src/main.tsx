import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// ═══════════════════════════════════════════════════
// Auto-reload quando chunk JS falha após novo deploy
// ═══════════════════════════════════════════════════

window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

function handleChunkError(message?: string) {
  if (
    message?.includes('Failed to fetch dynamically imported module') ||
    message?.includes('Importing a module script failed') ||
    message?.includes('error loading dynamically imported module')
  ) {
    const key = 'chunk-reload-ts';
    const last = sessionStorage.getItem(key);
    const now = Date.now();

    if (!last || now - parseInt(last) > 10000) {
      sessionStorage.setItem(key, now.toString());
      window.location.reload();
    }
  }
}

window.addEventListener('error', (event) => {
  handleChunkError(event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  handleChunkError(event.reason?.message);
});

// ═══════════════════════════════════════════════════

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
