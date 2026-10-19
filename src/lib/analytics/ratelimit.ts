/**
 * A key's whole stored state: two numbers, whatever the request volume. An
 * earlier version kept every timestamp, which at 10,000 keys times 300 events
 * is tens of megabytes inside a 320Mi pod limit, and session_id is derived
 * from the user agent, so one address can mint keys at will.
 */
export type Bucket = { count: number; windowStart: number }

export type RateLimiter = {
  allow(id: string, nowMs: number): boolean
  size(): number
  /** The stored state for one key, for tests that guard its shape. */
  peek(id: string): Bucket | undefined
}

/**
 * In-process counter per id; allow() is true when the event may pass. The
 * window is fixed rather than sliding: a key's counter resets once windowMs
 * has passed since its first counted event. The ceiling is therefore per
 * window, not per trailing window, which lets a burst straddling a boundary
 * spend two windows' budget in quick succession. At 300 events an hour that
 * is irrelevant to the thing being prevented, which is a loop filling the
 * disk, and it is what keeps the per-key cost constant.
 */
export function createRateLimiter(opts: {
  limit: number
  windowMs: number
  maxKeys: number
}): RateLimiter {
  const hits = new Map<string, Bucket>()
  return {
    size: () => hits.size,
    peek: (id) => hits.get(id),
    allow(id, nowMs) {
      // Sweep expired keys once over the cap. Keys minted during a flood are
      // not expired, so if the sweep frees nothing, reset the whole map: this
      // bounds both memory and the per-request scan cost (the scan cannot
      // repeat on every request), at the price of forgetting some counters.
      if (hits.size > opts.maxKeys) {
        for (const [k, bucket] of hits) {
          if (bucket.windowStart < nowMs - opts.windowMs) hits.delete(k)
        }
        if (hits.size > opts.maxKeys) hits.clear()
      }
      const existing = hits.get(id)
      if (existing === undefined || existing.windowStart < nowMs - opts.windowMs) {
        hits.set(id, { count: 1, windowStart: nowMs })
        return true
      }
      if (existing.count >= opts.limit) return false
      existing.count += 1
      return true
    },
  }
}
