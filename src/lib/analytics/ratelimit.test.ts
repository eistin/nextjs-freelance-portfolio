import { describe, expect, test } from 'vitest'
import { createRateLimiter } from './ratelimit'

const mk = (maxKeys = 100) => createRateLimiter({ limit: 3, windowMs: 1000, maxKeys })

describe('createRateLimiter', () => {
  test('allows up to the limit then drops', () => {
    const rl = mk()
    expect([1, 2, 3, 4].map((i) => rl.allow('a', i))).toEqual([true, true, true, false])
  })

  test('a different id has its own budget', () => {
    const rl = mk()
    for (let i = 0; i < 3; i++) rl.allow('a', i)
    expect(rl.allow('b', 5)).toBe(true)
  })

  test('the window rolls', () => {
    const rl = mk()
    for (let i = 0; i < 3; i++) rl.allow('a', i)
    expect(rl.allow('a', 2000)).toBe(true)
  })

  test('the key count stays bounded under a flood of fresh ids', () => {
    const rl = mk(100)
    // All within one window, so none is evictable by age.
    for (let i = 0; i < 5000; i++) rl.allow(`id-${i}`, 10 + i / 1000)
    expect(rl.size()).toBeLessThanOrEqual(101)
  })
})
