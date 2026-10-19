import { Pool } from 'pg'
import type { AnalyticsRow } from './event'

let pool: Pool | null = null
let warned = false

/** Null when no database is configured; logs once so local dev stays quiet. */
function getPool(): Pool | null {
  const url = process.env.ANALYTICS_DATABASE_URL
  if (!url) {
    if (!warned) {
      warned = true
      console.warn('analytics: ANALYTICS_DATABASE_URL is unset, events are not stored')
    }
    return null
  }
  // max 4: sized for a single replica.
  pool ??= new Pool({ connectionString: url, max: 4 })
  return pool
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS analytics_event (
    id            bigserial PRIMARY KEY,
    at            timestamptz NOT NULL DEFAULT now(),
    session_id    text        NOT NULL,
    kind          text        NOT NULL,
    path          text        NOT NULL,
    locale        text,
    country       char(2),
    source        text,
    referrer_host text,
    device        text,
    element       text,
    dwell_ms      integer
  )`,
  'CREATE INDEX IF NOT EXISTS analytics_event_at_idx ON analytics_event (at DESC)',
  'CREATE INDEX IF NOT EXISTS analytics_event_session_at_idx ON analytics_event (session_id, at)',
  'CREATE INDEX IF NOT EXISTS analytics_event_kind_at_idx ON analytics_event (kind, at DESC)',
]

export async function ensureSchema(): Promise<void> {
  const p = getPool()
  if (!p) return
  for (const statement of SCHEMA) await p.query(statement)
}

export async function insertEvent(row: AnalyticsRow): Promise<void> {
  const p = getPool()
  if (!p) return
  await p.query(
    `INSERT INTO analytics_event
       (session_id, kind, path, locale, country, source, referrer_host, device, element, dwell_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      row.sessionId,
      row.kind,
      row.path,
      row.locale,
      row.country,
      row.source,
      row.referrerHost,
      row.device,
      row.element,
      row.dwellMs,
    ],
  )
}
