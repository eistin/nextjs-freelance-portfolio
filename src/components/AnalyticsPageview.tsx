'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageUrl, pageview } from '@/lib/gtag';

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    pageview(pageUrl(pathname, searchParams.toString()));
  }, [pathname, searchParams]);

  return null;
}

// useSearchParams opts the subtree into client rendering, so the Suspense
// boundary keeps the surrounding pages statically rendered.
export function AnalyticsPageview() {
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
