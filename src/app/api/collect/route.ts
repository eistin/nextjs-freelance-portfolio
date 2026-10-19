import { ensureSchema, insertEvent } from '@/lib/analytics/db'
import { buildEvent } from '@/lib/analytics/event'

// pg needs Node APIs and cannot run on the edge runtime.
export const runtime = 'nodejs'

const LIMIT_PER_HOUR = 300
const WINDOW_MS = 3_600_000
const hits = new Map<string, number[]>()

/** In-process rolling window per session id; true when the event is allowed. */
function allow(id: string, nowMs: number): boolean {
  // Opportunistic sweep so the map cannot grow without bound.
  if (hits.size > 10_000) {
    for (const [k, ts] of hits) {
      if (ts[ts.length - 1] < nowMs - WINDOW_MS) hits.delete(k)
    }
  }
  const recent = (hits.get(id) ?? []).filter((t) => t > nowMs - WINDOW_MS)
  if (recent.length >= LIMIT_PER_HOUR) {
    hits.set(id, recent)
    return false
  }
  recent.push(nowMs)
  hits.set(id, recent)
  return true
}

let schemaReady: Promise<void> | null = null

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(null, { status: 204 })
    }

    const now = new Date()
    const row = buildEvent(
      request.headers,
      body,
      now,
      process.env.ANALYTICS_SALT_SECRET ?? '',
    )
    if (!row || !allow(row.sessionId, now.getTime())) {
      return new Response(null, { status: 204 })
    }

    schemaReady ??= ensureSchema().catch((err) => {
      schemaReady = null // retry on the next request
      throw err
    })
    await schemaReady
    await insertEvent(row)
  } catch (err) {
    // Message only: never the request, its headers, the ip or the user agent.
    console.error('analytics: collect failed:', err instanceof Error ? err.message : 'unknown')
  }
  return new Response(null, { status: 204 })
}
