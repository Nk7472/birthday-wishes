import { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { WishProvider } from './shared/WishContext';
import { getTemplate } from '../templates';

function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  );
}

/**
 * Mounts one template for a normalized wish. Mounting = the show starts, so
 * change `key` (or remount) to replay it.
 */
export default function TemplateRunner({ templateId, wish }) {
  const t = getTemplate(templateId);
  const Scene = t.Component;
  return (
    <ErrorBoundary key={t.id}>
      <WishProvider wish={wish}>
        <Suspense fallback={<Loading />}>
          <Scene />
        </Suspense>
      </WishProvider>
    </ErrorBoundary>
  );
}
