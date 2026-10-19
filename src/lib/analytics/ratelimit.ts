export type RateLimiter = {
  allow(id: string, nowMs: number): boolean
  size(): number
}

/** In-process rolling window per id; allow() is true when the event may pass. */
export function createRateLimiter(opts: {
  limit: number
  windowMs: number
  maxKeys: number
}): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    size: () => hits.size,
    allow(id, nowMs) {
      // Sweep expired keys once over the cap. Keys minted during a flood are
      // not expired, so if the sweep frees nothing, reset the whole map: this
      // bounds both memory and the per-request scan cost (the scan cannot
      // repeat on every request), at the price of forgetting some counters.
      if (hits.size > opts.maxKeys) {
        for (const [k, ts] of hits) {
          if (ts[ts.length - 1] < nowMs - opts.windowMs) hits.delete(k)
        }
        if (hits.size > opts.maxKeys) hits.clear()
      }
      const recent = (hits.get(id) ?? []).filter((t) => t > nowMs - opts.windowMs)
      if (recent.length >= opts.limit) {
        hits.set(id, recent)
        return false
      }
      recent.push(nowMs)
      hits.set(id, recent)
      return true
    },
  }
}
