import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyDarkMode, getInitialDarkMode } from './hooks/useDarkMode';
import './index.css';

applyDarkMode(getInitialDarkMode());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
