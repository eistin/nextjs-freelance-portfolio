import { describe, expect, test } from 'vitest'
import { buildEvent } from './event'

const NOW = new Date('2026-10-19T12:00:00Z')
const SECRET = 'test-secret'
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

function headers(extra: Record<string, string | null> = {}): Headers {
  const base: Record<string, string | null> = {
    'cf-connecting-ip': '203.0.113.7',
    'cf-ipcountry': 'FR',
    'user-agent': DESKTOP_UA,
    ...extra,
  }
  const h = new Headers()
  for (const [k, v] of Object.entries(base)) if (v !== null) h.set(k, v)
  return h
}

const view = { kind: 'view', path: '/en/blog?x=1', locale: 'en' }

describe('buildEvent', () => {
  test('builds a view row from a well-formed request', () => {
    const row = buildEvent(
      headers(),
      { ...view, referrer: 'https://www.linkedin.com/feed/' },
      NOW,
      SECRET,
    )
    expect(row).toEqual({
      sessionId: expect.stringMatching(/^[0-9a-f]{16}$/),
      kind: 'view',
      path: '/blog',
      locale: 'en',
      country: 'FR',
      source: 'linkedin',
      referrerHost: 'www.linkedin.com',
      device: 'desktop',
      element: null,
      dwellMs: null,
    })
  })

  test('drops the event when CF-Connecting-IP is absent', () => {
    expect(buildEvent(headers({ 'cf-connecting-ip': null }), view, NOW, SECRET)).toBeNull()
  })

  test('drops the event when the user agent is a bot', () => {
    expect(
      buildEvent(headers({ 'user-agent': 'Googlebot/2.1' }), view, NOW, SECRET),
    ).toBeNull()
  })

  test('drops the event when the user agent is missing', () => {
    expect(buildEvent(headers({ 'user-agent': null }), view, NOW, SECRET)).toBeNull()
  })

  test('drops the event when the user agent is empty', () => {
    expect(buildEvent(headers({ 'user-agent': '' }), view, NOW, SECRET)).toBeNull()
  })

  test('stores CF-IPCountry XX verbatim', () => {
    expect(buildEvent(headers({ 'cf-ipcountry': 'XX' }), view, NOW, SECRET)?.country).toBe('XX')
  })
  test('stores CF-IPCountry T1 verbatim', () => {
    expect(buildEvent(headers({ 'cf-ipcountry': 'T1' }), view, NOW, SECRET)?.country).toBe('T1')
  })
  test('leaves country null when the header is absent', () => {
    expect(buildEvent(headers({ 'cf-ipcountry': null }), view, NOW, SECRET)?.country).toBeNull()
  })

  test('rejects an unknown kind', () => {
    expect(buildEvent(headers(), { ...view, kind: 'exfiltrate' }, NOW, SECRET)).toBeNull()
  })
  test('rejects a click with no element', () => {
    expect(buildEvent(headers(), { ...view, kind: 'click' }, NOW, SECRET)).toBeNull()
  })
  test('truncates an over-long element name', () => {
    const row = buildEvent(
      headers(),
      { ...view, kind: 'click', element: 'a'.repeat(200) },
      NOW,
      SECRET,
    )
    expect(row?.element).toBe('a'.repeat(64))
  })

  test('clamps dwell_ms above the ceiling', () => {
    const row = buildEvent(
      headers(),
      { ...view, kind: 'leave', dwellMs: 3 * 24 * 3600 * 1000 },
      NOW,
      SECRET,
    )
    expect(row?.dwellMs).toBe(1_800_000)
  })
  test('rejects a negative dwell_ms', () => {
    expect(buildEvent(headers(), { ...view, kind: 'leave', dwellMs: -5 }, NOW, SECRET)).toBeNull()
  })
  test('rejects a non-integer dwell_ms', () => {
    expect(buildEvent(headers(), { ...view, kind: 'leave', dwellMs: '12' }, NOW, SECRET)).toBeNull()
    expect(buildEvent(headers(), { ...view, kind: 'leave', dwellMs: 1.5 }, NOW, SECRET)).toBeNull()
  })
  test('ignores dwell_ms on a view', () => {
    expect(buildEvent(headers(), { ...view, dwellMs: 5000 }, NOW, SECRET)?.dwellMs).toBeNull()
  })

  test('rejects a body that is not an object', () => {
    expect(buildEvent(headers(), null, NOW, SECRET)).toBeNull()
    expect(buildEvent(headers(), [], NOW, SECRET)).toBeNull()
    expect(buildEvent(headers(), 'view', NOW, SECRET)).toBeNull()
  })

  test('rejects a body with no usable path', () => {
    expect(buildEvent(headers(), { kind: 'view' }, NOW, SECRET)).toBeNull()
  })

  test('nulls a locale that is not a supported one', () => {
    expect(buildEvent(headers(), { ...view, locale: 'zz' }, NOW, SECRET)?.locale).toBeNull()
  })

  describe('utm_source bounding', () => {
    const src = (q: string) =>
      buildEvent(headers(), { kind: 'view', path: `/?utm_source=${q}` }, NOW, SECRET)?.source

    test('lowercases and trims', () => {
      expect(src('%20Newsletter%20')).toBe('newsletter')
    })
    test('treats whitespace-only as absent', () => {
      expect(src('%20%20')).toBe('direct')
    })
    test('caps the length', () => {
      expect(src('a'.repeat(500))).toBe('a'.repeat(32))
    })
  })
})
