// Browser side of the first-party collector. Everything here is fire and
// forget: analytics must never throw into the page or block rendering.

export interface CollectEvent {
  kind: 'view' | 'click' | 'leave';
  path: string;
  locale?: string;
  referrer?: string;
  element?: string;
  dwellMs?: number;
}

const ENDPOINT = '/api/collect';

export function send(event: CollectEvent): void {
  try {
    if (typeof window === 'undefined') return;
    const body = JSON.stringify(
      event.dwellMs === undefined
        ? event
        : { ...event, dwellMs: Math.max(0, Math.round(event.dwellMs)) },
    );

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // A Blob with a JSON type keeps the content type honest; the beacon
      // survives page unload where a plain fetch would be cancelled.
      const queued = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: 'application/json' }),
      );
      if (queued) return;
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallowed on purpose.
  }
}

// Accumulates only the time the page was visible. The clock is injected so
// tests need no fake timers. A clock that moves backwards never produces a
// negative value.
export function createDwellTimer(now: () => number) {
  let accumulated = 0;
  let since: number | null = null;

  const segment = () => (since === null ? 0 : Math.max(0, now() - since));

  return {
    visible() {
      if (since === null) since = now();
    },
    hidden() {
      accumulated += segment();
      since = null;
    },
    elapsed() {
      return accumulated + segment();
    },
  };
}
