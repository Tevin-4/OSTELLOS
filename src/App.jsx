import { lazy, Suspense } from 'react';
import ThemeProvider from './ThemeProvider';

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