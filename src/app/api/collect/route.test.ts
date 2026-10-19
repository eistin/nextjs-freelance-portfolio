import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// The one justified mock: there is no test database, and the database-down
// path is the headline guarantee.
const insertEvent = vi.fn()
const ensureSchema = vi.fn()
vi.mock('@/lib/analytics/db', () => ({
  insertEvent: (...a: unknown[]) => insertEvent(...a),
  ensureSchema: (...a: unknown[]) => ensureSchema(...a),
}))

import { POST } from './route'

const SECRET = 'route-test-secret-'.padEnd(64, 'x')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'

function req(
  body: unknown,
  headers: Record<string, string | null> = {},
  raw = false,
): Request {
  const h = new Headers({ 'cf-connecting-ip': '203.0.113.7', 'user-agent': UA })
  for (const [k, v] of Object.entries(headers)) {
    if (v === null) h.delete(k)
    else h.set(k, v)
  }
  return new Request('http://localhost/api/collect', {
    method: 'POST',
    headers: h,
    body: raw ? (body as string) : JSON.stringify(body),
  })
}

const good = { kind: 'view', path: '/en', locale: 'en' }

afterEach(() => {
  // Without this each beforeEach re-wraps the previous console spy and
  // mock.calls accumulates across the whole file.
  vi.restoreAllMocks()
})

beforeEach(() => {
  insertEvent.mockReset()
  ensureSchema.mockReset()
  insertEvent.mockResolvedValue(undefined)
  ensureSchema.mockResolvedValue(undefined)
  vi.stubEnv('ANALYTICS_SALT_SECRET', SECRET)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/collect', () => {
  test('well-formed event: 204 and one insert', async () => {
    const res = await POST(req(good))
    expect(res.status).toBe(204)
    expect(insertEvent).toHaveBeenCalledTimes(1)
  })

  test('malformed JSON: 204, no insert', async () => {
    const res = await POST(req('{not json', {}, true))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('body that is not an object: 204, no insert', async () => {
    const res = await POST(req([1, 2]))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('bot user agent: 204, no insert', async () => {
    const res = await POST(req(good, { 'user-agent': 'Googlebot/2.1' }))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('missing CF-Connecting-IP: 204, no insert', async () => {
    const res = await POST(req(good, { 'cf-connecting-ip': null }))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('missing secret: 204, no insert', async () => {
    vi.stubEnv('ANALYTICS_SALT_SECRET', '')
    const res = await POST(req(good))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('oversized content-length: 204, no insert', async () => {
    const res = await POST(req(good, { 'content-length': '5000000' }))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('oversized body without an honest content-length: 204, no insert', async () => {
    const big = JSON.stringify({ ...good, pad: 'x'.repeat(100_000) })
    const res = await POST(req(big, { 'content-length': '10' }, true))
    expect(res.status).toBe(204)
    expect(insertEvent).not.toHaveBeenCalled()
  })

  test('insertEvent throwing: still 204', async () => {
    insertEvent.mockRejectedValue(new Error('connection refused'))
    const res = await POST(req(good))
    expect(res.status).toBe(204)
  })

  // schemaReady is memoised at module level, so these need a fresh module
  // instance or the first passing test would short-circuit ensureSchema.
  describe('schema bootstrap (fresh module per test)', () => {
    async function freshPost() {
      vi.resetModules()
      return (await import('./route')).POST
    }

    test('ensureSchema rejecting: 204, the rejection really ran, no insert', async () => {
      ensureSchema.mockRejectedValue(new Error('db down'))
      const post = await freshPost()
      const res = await post(req(good))
      expect(res.status).toBe(204)
      expect(ensureSchema).toHaveBeenCalledTimes(1)
      expect(insertEvent).not.toHaveBeenCalled()
    })

    test('a failed bootstrap is retried so the next request recovers', async () => {
      ensureSchema.mockRejectedValueOnce(new Error('db down'))
      const post = await freshPost()
      expect((await post(req(good))).status).toBe(204)
      expect(insertEvent).not.toHaveBeenCalled()

      const res = await post(req(good))
      expect(res.status).toBe(204)
      expect(ensureSchema).toHaveBeenCalledTimes(2)
      expect(insertEvent).toHaveBeenCalledTimes(1)
    })
  })

  test('errors are logged without the ip or user agent', async () => {
    insertEvent.mockRejectedValue(new Error('boom'))
    await POST(req(good))
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).not.toContain('203.0.113.7')
    expect(logged).not.toContain('Macintosh')
  })

  test('rate limit: events past 300 per session are dropped with 204', async () => {
    const ua = UA + ' ratelimit-case'
    let inserted = 0
    for (let i = 0; i < 305; i++) {
      const res = await POST(req(good, { 'user-agent': ua }))
      expect(res.status).toBe(204)
    }
    inserted = insertEvent.mock.calls.length
    expect(inserted).toBe(300)
  })
})
