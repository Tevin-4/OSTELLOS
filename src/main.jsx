import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initScrollReveal } from './scroll-reveal';
import './styles.css';
import './styles-dark.css';

const mount = document.getElementById('cube-mount');
if (mount) {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}