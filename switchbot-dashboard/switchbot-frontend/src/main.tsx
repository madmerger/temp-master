import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './components/Dashboard';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root 要素が見つかりません');
}

createRoot(rootElement).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
