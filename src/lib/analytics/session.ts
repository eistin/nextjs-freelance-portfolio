import { createHmac } from 'node:crypto'

/**
 * Derives an opaque, daily-rotating visitor identifier. The key includes the
 * UTC date, so the same visitor gets a different id each day and visits on
 * different days cannot be linked. The caller must discard the ip after
 * calling this; it is never stored.
 */
export function sessionId(
  ip: string,
  userAgent: string,
  now: Date,
  secret: string,
): string {
  const utcDay = now.toISOString().slice(0, 10)
  return createHmac('sha256', secret + utcDay)
    .update(ip + '\n' + userAgent)
    .digest('hex')
    .slice(0, 16)
}
