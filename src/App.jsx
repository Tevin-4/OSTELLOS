import { lazy, Suspense } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { initScrollReveal } from './scroll-reveal';

const HeroCube = lazy(() => import('./components/HeroCube'));

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <HeroCube />
      </Suspense>
    </ThemeProvider>
  );
}