import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const MEASUREMENT_ID = 'G-TEST123456';

type GtagCall = [string, string, Record<string, unknown>?];

function installWindow(): GtagCall[] {
  const calls: GtagCall[] = [];
  const gtag = (...args: GtagCall) => {
    calls.push(args);
  };
  Object.defineProperty(globalThis, 'window', {
    value: { gtag, location: { origin: 'https://edwindev.cloud' } },
    configurable: true,
    writable: true,
  });
  return calls;
}

function removeWindow() {
  Reflect.deleteProperty(globalThis as Record<string, unknown>, 'window');
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  removeWindow();
  vi.unstubAllEnvs();
});

describe('pageUrl', () => {
  test('appends the query string to the pathname', async () => {
    const { pageUrl } = await import('./gtag');

    expect(pageUrl('/en/blog', 'tag=go')).toBe('/en/blog?tag=go');
  });

  test('returns the bare pathname when there is no query string', async () => {
    const { pageUrl } = await import('./gtag');

    expect(pageUrl('/en', '')).toBe('/en');
  });
});

describe('pageview', () => {
  test('sends a page_view event for the new url', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', MEASUREMENT_ID);
    const calls = installWindow();
    const { pageview } = await import('./gtag');

    pageview('/en/projects/hixels');

    expect(calls).toEqual([
      [
        'event',
        'page_view',
        {
          page_path: '/en/projects/hixels',
          page_location: 'https://edwindev.cloud/en/projects/hixels',
        },
      ],
    ]);
  });

  test('does not throw when gtag has not loaded yet', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', MEASUREMENT_ID);
    installWindow();
    (globalThis.window as unknown as { gtag?: unknown }).gtag = undefined;
    const { pageview } = await import('./gtag');

    expect(() => pageview('/en')).not.toThrow();
  });

  test('does not call gtag when no measurement id is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    const calls = installWindow();
    const { pageview } = await import('./gtag');

    pageview('/en');

    expect(calls).toEqual([]);
  });
});
