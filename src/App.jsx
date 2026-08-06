import { lazy, Suspense } from 'react';

const HeroCube = lazy(() => import('./components/HeroCube'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <HeroCube />
    </Suspense>
  );
}