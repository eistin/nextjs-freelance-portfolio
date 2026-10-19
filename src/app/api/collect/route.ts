import { ensureSchema, insertEvent } from '@/lib/analytics/db'
import { createRateLimiter } from '@/lib/analytics/ratelimit'
import { buildEvent, isUsableSecret } from '@/lib/analytics/event'

// pg needs Node APIs and cannot run on the edge runtime.
export const runtime = 'nodejs'

const limiter = createRateLimiter({
  limit: 300,
  windowMs: 3_600_000,
  maxKeys: 10_000,
})

/** A real event is a few hundred bytes; 8 KB is generous and bounds memory. */
const MAX_BODY_BYTES = 8192

/** Reads the body up to the cap; null when it is larger. Never buffers more. */
async function readBounded(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

let secretWarned = false
let schemaReady: Promise<void> | null = null

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = process.env.ANALYTICS_SALT_SECRET
    if (!isUsableSecret(secret)) {
      // Fail closed, loudly but once: no hashing, no insert, still 204.
      if (!secretWarned) {
        secretWarned = true
        console.error(
          'analytics: ANALYTICS_SALT_SECRET is missing or too short, all events are dropped',
        )
      }
      return new Response(null, { status: 204 })
    }

    let body: unknown
    try {
      const text = await readBounded(request)
      if (text === null) return new Response(null, { status: 204 })
      body = JSON.parse(text)
    } catch {
      return new Response(null, { status: 204 })
    }

    const now = new Date()
    const row = buildEvent(
      request.headers,
      body,
      now,
      secret,
    )
    if (!row || !limiter.allow(row.sessionId, now.getTime())) {
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
