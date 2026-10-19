import { describe, expect, test } from 'vitest'
import { sessionId } from './session'

const IP = '203.0.113.7'
const UA = 'Mozilla/5.0 (test)'
const SECRET = 'test-secret-not-real'

describe('sessionId', () => {
  test('is deterministic for the same visitor on the same day', () => {
    const a = sessionId(IP, UA, new Date('2026-10-19T08:00:00Z'), SECRET)
    const b = sessionId(IP, UA, new Date('2026-10-19T17:45:10Z'), SECRET)
    expect(a).toBe(b)
  })

  test('differs for two visitors on the same day', () => {
    const now = new Date('2026-10-19T08:00:00Z')
    expect(sessionId('203.0.113.7', UA, now, SECRET)).not.toBe(
      sessionId('203.0.113.8', UA, now, SECRET),
    )
  })

  test('changes at the UTC midnight boundary', () => {
    const before = sessionId(IP, UA, new Date('2026-10-19T23:59:59Z'), SECRET)
    const after = sessionId(IP, UA, new Date('2026-10-20T00:00:01Z'), SECRET)
    expect(before).not.toBe(after)
  })

  test('is unchanged by local time zone', () => {
    const utc = new Date('2026-10-19T23:30:00Z')
    const offset = new Date('2026-10-20T01:30:00+02:00')
    expect(sessionId(IP, UA, utc, SECRET)).toBe(sessionId(IP, UA, offset, SECRET))
  })

  test('returns 16 lowercase hex characters', () => {
    expect(sessionId(IP, UA, new Date('2026-10-19T08:00:00Z'), SECRET)).toMatch(
      /^[0-9a-f]{16}$/,
    )
  })

  test('differs when only the secret differs', () => {
    const now = new Date('2026-10-19T08:00:00Z')
    expect(sessionId(IP, UA, now, 'secret-one')).not.toBe(
      sessionId(IP, UA, now, 'secret-two'),
    )
  })
})
