import { lazy, Suspense } from 'react';
import ThemeProvider from './ThemeProvider';
import WebGLErrorBoundary from './components/WebGLErrorBoundary';

const HeroCube = lazy(() => import('./components/HeroCube'));

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <WebGLErrorBoundary>
          <HeroCube />
        </WebGLErrorBoundary>
      </Suspense>
    </ThemeProvider>
  );
}