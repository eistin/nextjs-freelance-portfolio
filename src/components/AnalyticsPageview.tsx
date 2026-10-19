'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageUrl, pageview } from '@/lib/gtag';
import { createDwellTimer, send } from '@/lib/analytics/beacon';

// Only the first view of a session has a meaningful document.referrer.
let firstView = true;

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    pageview(pageUrl(pathname, searchParams.toString()));
  }, [pathname, searchParams]);

  useEffect(() => {
    try {
      const path = pathname || '/';
      const first = path.split('/')[1];
      const locale = first === 'fr' || first === 'en' ? first : document.documentElement.lang.slice(0, 2) || undefined;
      const timer = createDwellTimer(() => Date.now());
      if (document.visibilityState !== 'hidden') timer.visible();

      send({ kind: 'view', path, locale, referrer: firstView ? document.referrer || undefined : undefined });
      firstView = false;

      // Rule: exactly one leave per page view, sent by whichever comes first,
      // the tab being hidden or the route changing. Later visibility flips of
      // the same view send nothing, so each view yields one dwell sample and
      // the median time stays meaningful. Hidden is used rather than
      // beforeunload because it is the last reliable signal on mobile Safari.
      let sent = false;
      const leave = () => {
        if (sent) return;
        sent = true;
        send({ kind: 'leave', path, locale, dwellMs: timer.elapsed() });
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') {
          timer.hidden();
          leave();
        } else {
          timer.visible();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        timer.hidden();
        leave();
      };
    } catch {
      return undefined;
    }
  }, [pathname]);

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
