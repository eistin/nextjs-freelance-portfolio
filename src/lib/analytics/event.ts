import { routing } from '@/i18n/routing'
import { sessionId } from './session'
import {
  classifySource,
  deviceFromUserAgent,
  isBot,
  normalisePath,
} from './classify'

export type AnalyticsRow = {
  sessionId: string
  kind: 'view' | 'click' | 'leave'
  path: string
  locale: string | null
  country: string | null
  source: string
  referrerHost: string | null
  device: string
  element: string | null
  dwellMs: number | null
}

const KINDS = ['view', 'click', 'leave'] as const
const MAX_ELEMENT = 64
/** 30 minutes, the inactivity gap that bounds a visit. */
const MAX_DWELL_MS = 1_800_000
/** Longest raw url we will parse; anything longer is junk or an attack. */
const MAX_RAW_URL = 2048
const MAX_PATH = 256
/**
 * Real campaign names are short ("newsletter", "linkedin", "malt"). 32 keeps
 * every plausible label whole while bounding what a forged request can store.
 */
const MAX_UTM_SOURCE = 32

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function utmSourceFrom(rawUrl: string): string | null {
  let value: string | null
  try {
    value = new URL(rawUrl, 'http://localhost').searchParams.get('utm_source')
  } catch {
    return null
  }
  const bounded = value?.trim().toLowerCase().slice(0, MAX_UTM_SOURCE).trim()
  return bounded ? bounded : null
}

/**
 * Turns a collector request into a row, or null when the event must be
 * dropped. Pure: no I/O. The ip is hashed and then goes out of scope; it is
 * never part of the returned row.
 */
export function buildEvent(
  headers: Headers,
  body: unknown,
  now: Date,
  secret: string,
): AnalyticsRow | null {
  // Cloudflare sets this and strips any client-supplied copy. Absent means the
  // request did not come through Cloudflare, so it is not a real visit.
  const ip = headers.get('cf-connecting-ip')
  if (!ip) return null

  // A missing header must not reach isBot as "null"; coalesce to "", which
  // isBot treats as a bot, so a request with no user agent is dropped.
  const userAgent = headers.get('user-agent') ?? ''
  if (isBot(userAgent)) return null

  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const b = body as Record<string, unknown>

  const kind = KINDS.find((k) => k === b.kind)
  if (!kind) return null

  const rawPath = str(b.path)
  if (!rawPath || rawPath.length > MAX_RAW_URL) return null
  const path = normalisePath(rawPath).slice(0, MAX_PATH)

  let element: string | null = null
  if (kind === 'click') {
    const raw = str(b.element)
    if (!raw) return null
    element = raw.slice(0, MAX_ELEMENT)
  }

  let dwellMs: number | null = null
  if (kind === 'leave' && b.dwellMs !== undefined && b.dwellMs !== null) {
    if (
      typeof b.dwellMs !== 'number' ||
      !Number.isInteger(b.dwellMs) ||
      b.dwellMs < 0
    ) {
      return null
    }
    dwellMs = Math.min(b.dwellMs, MAX_DWELL_MS)
  }

  const locale = routing.locales.find((l) => l === b.locale) ?? null

  // The browser sends document.referrer in the body; the Referer header of the
  // beacon itself is our own page, so it is only a fallback.
  const referrer = str(b.referrer) ?? headers.get('referer')
  const { source, referrerHost } = classifySource(referrer, utmSourceFrom(rawPath))

  return {
    sessionId: sessionId(ip, userAgent, now, secret),
    kind,
    path,
    locale,
    country: headers.get('cf-ipcountry'),
    source,
    referrerHost,
    device: deviceFromUserAgent(userAgent),
    element,
    dwellMs,
  }
}
