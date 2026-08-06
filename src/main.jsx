import { createRoot } from 'react-dom/client';
import App from './App';
import { initScrollReveal } from './scroll-reveal';
import './styles.css';
import './styles-dark.css';

const mount = document.getElementById('cube-mount');
if (mount) {
  createRoot(mount).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}