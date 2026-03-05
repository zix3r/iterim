import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router'; // 1. Pridedame šį importą
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* 2. Apgaubiame App komponentą */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);