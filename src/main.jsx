import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { refreshUser } from './lib/auth';
import { startTracking } from './lib/track';

startTracking();
refreshUser();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
