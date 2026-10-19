import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// The collector's browser side, stubbed so the assertions are about what
// analytics.ts decides to forward rather than about transport.
const send = vi.fn()
vi.mock('./analytics/beacon', () => ({ send: (e: unknown) => send(e) }))
vi.mock('./gtag', () => ({ GA_MEASUREMENT_ID: 'G-TEST' }))

const gtag = vi.fn()

beforeEach(async () => {
  send.mockClear()
  gtag.mockClear()
  // Tests run in the node environment, so window is ours to define.
  vi.stubGlobal('window', {
    gtag,
    location: { pathname: '/contact', href: 'https://edwindev.cloud/contact?utm_source=x' },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function load() {
  vi.resetModules()
  return (await import('./analytics')).analytics
}

describe('analytics.track', () => {
  test('forwards a form event to the collector as a named click', async () => {
    const analytics = await load()
    analytics.trackFormEvent('submit', 'contact')
    expect(send).toHaveBeenCalledWith({
      kind: 'click',
      path: '/contact',
      element: 'form_submit',
    })
  })

  test('the GA4 call for a form event is unchanged', async () => {
    const analytics = await load()
    analytics.trackFormEvent('submit', 'contact')
    expect(gtag).toHaveBeenCalledWith('event', 'form_submit', {
      event_category: 'engagement',
      event_label: 'contact',
    })
  })

  test('a button click still reaches both destinations', async () => {
    const analytics = await load()
    analytics.trackButtonClick('hero_cta', '#contact')
    expect(send).toHaveBeenCalledWith({
      kind: 'click',
      path: '/contact',
      element: 'hero_cta',
    })
    expect(gtag).toHaveBeenCalledWith('event', 'hero_cta_click', {
      event_category: 'engagement',
      event_label: 'hero_cta -> #contact',
    })
  })

  test('a section view reaches GA only, not the collector', async () => {
    const analytics = await load()
    analytics.trackSectionView('services')
    expect(send).not.toHaveBeenCalled()
    expect(gtag).toHaveBeenCalledWith('event', 'view', {
      event_category: 'section',
      event_label: 'services',
    })
  })

  test('nothing is written to device storage', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem,
      removeItem: vi.fn(),
    })
    const analytics = await load()
    analytics.trackButtonClick('github', 'https://github.com/eistin')
    analytics.trackFormEvent('submit', 'contact')
    expect(setItem).not.toHaveBeenCalled()
  })
})
