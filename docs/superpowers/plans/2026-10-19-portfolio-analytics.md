# Portfolio Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect first-party visitor events from edwindev.cloud into a Postgres database on the cluster, and read them as a thirteen-panel Grafana dashboard.

**Architecture:** The Next.js app emits view, click and leave events to its own `POST /api/collect`. The collector derives a cookieless daily session id from the Cloudflare-supplied client IP, classifies source, device and path, discards the IP, and inserts one row into `analytics_event` in a new CNPG cluster. Grafana reads that table through a read-only Postgres datasource. All classification logic is pure and unit-tested; the database layer is thin and verified live.

**Tech Stack:** Next.js 15 (App Router), TypeScript, vitest, `pg`, CloudNativePG, Grafana 13.7.0, kustomize, SOPS/KSOPS, ArgoCD.

**Spec:** `docs/superpowers/specs/2026-10-19-portfolio-analytics-design.md`

## Global Constraints

- No em dashes in any file, comment, commit message or copy. Use a comma, colon, parentheses, or two sentences.
- `stini-cluster` is IaC only. No `kubectl apply`, `patch`, `delete` or `helm install` against the cluster. Everything lands through git-committed ArgoCD manifests.
- Secrets only in SOPS-encrypted files. `nextjs-freelance-portfolio` is a **public** repo: no plaintext password, key or token may ever be committed to it.
- `export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"` is required before any `sops` command on this machine.
- The collector must never degrade the website. Every failure path returns 204 and logs server-side.
- No IP address and no raw user agent is ever written to the database or to logs.
- Node is at 66% memory with limits 134% overcommitted. Size every new request conservatively.
- The portfolio repo commits straight to `main`; pushing triggers the deploy workflow.
- Profile-hub ships before the portfolio or the portfolio build breaks. Not touched by this plan, but do not reorder deploys.

## Review Focus

Input classes the spec implies but which no task's happy path exercises. Each has a test pinned to the task that owns the code.

1. **`CF-Connecting-IP` absent.** A direct-to-origin probe bypassing Cloudflare must be dropped, not counted, and must not produce a shared session id. (Task 4)
2. **Database unreachable.** The collector must still return 204 and the page must render normally. This is an anti-goal in the spec and the most expensive failure to ship. (Task 4)
3. **`dwell_ms` absurd or hostile.** A tab open for three days, a negative number, a non-integer, or a forged beacon must not poison the median on panel 3. (Task 5)
4. **UTC midnight boundary.** The session id must change exactly at the UTC date rollover, or visits silently join across days and the privacy argument breaks. (Task 2)
5. **`CF-IPCountry` of `XX` or `T1`.** Stored verbatim rather than nulled or crashed on. (Task 4)

---

## File Structure

**Portfolio repo (`nextjs-freelance-portfolio`)**

| Path | Responsibility |
|------|----------------|
| `src/lib/analytics/classify.ts` | Pure: bot detection, device bucket, source classification, path normalisation |
| `src/lib/analytics/classify.test.ts` | Its tests |
| `src/lib/analytics/session.ts` | Pure: daily session id derivation |
| `src/lib/analytics/session.test.ts` | Its tests |
| `src/lib/analytics/event.ts` | Pure: build a row from headers plus body, or reject it |
| `src/lib/analytics/event.test.ts` | Its tests |
| `src/lib/analytics/db.ts` | Pool, `ensureSchema`, `insertEvent`. The only file that touches Postgres |
| `src/app/api/collect/route.ts` | Thin HTTP handler: parse, delegate, always 204 |
| `src/lib/analytics/beacon.ts` | Client side: send an event, never throw |
| `src/lib/analytics.ts` | Modify: existing tracker also sends to the beacon |
| `src/components/AnalyticsPageview.tsx` | Modify: emit view and leave with dwell time |
| `deploy/postgres.yaml` | CNPG `Cluster` for `portfolio-db` |
| `deploy/retention-cronjob.yaml` | Nightly delete of rows older than 24 months |
| `deploy/secrets.sops.yaml` | Modify: add salt secret and database passwords |
| `deploy/deployment.yaml` | Modify: database env, memory limit |
| `deploy/kustomization.yaml` | Modify: register the new resources |

**Cluster repo (`stini-cluster`)**

| Path | Responsibility |
|------|----------------|
| `argocd/monitoring/analytics-db-secret.sops.yaml` | Read-only password, in the `monitoring` namespace |
| `argocd/monitoring/dashboards/portfolio-analytics.json` | The thirteen panels |
| `argocd/monitoring/kustomization.yaml` | Modify: register dashboard and secret |
| `argocd/base/apps/grafana.yaml` | Modify: Postgres datasource plus `env` block |
| `argocd/base/apps/victoria-metrics.yaml` | Modify: retention 30d to 90d |

---

## Task 1: VictoriaMetrics retention to 90 days

Independent of everything else. Doing it first gets a value change in front of a reviewer before the larger work lands.

**Files:**
- Modify: `stini-cluster/argocd/base/apps/victoria-metrics.yaml`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Change `retentionPeriod` from `30d` to `90d`**

Under `server.retentionPeriod`.

- [ ] **Step 2: Update the stale sizing comment in the same edit**

The comment above `persistentVolume.size` currently reads "~2 GB expected for 30d at this scale". Replace with the measured figures from the spec: 46,607 active series, about 51 MB/day measured 2026-10-19, so roughly 4.6 GB at 90 days against 9.5 GB available. Leaving the old comment is a plan failure, not a nitpick.

- [ ] **Step 3: Validate the manifest renders**

Run: `cd stini-cluster && kustomize build argocd/base > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add argocd/base/apps/victoria-metrics.yaml
git commit -m "feat(monitoring): raise VictoriaMetrics retention to 90d"
```

---

## Task 2: Session id derivation

**Files:**
- Create: `src/lib/analytics/session.ts`
- Test: `src/lib/analytics/session.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `sessionId(ip: string, userAgent: string, now: Date, secret: string): string` returning 16 lowercase hex characters.

- [ ] **Step 1: Write the failing tests**

```ts
test('is deterministic for the same visitor on the same day', ...)
  // two calls, same inputs, different Date objects for the same UTC day => equal

test('differs for two visitors on the same day', ...)
  // different ip => different id

test('changes at the UTC midnight boundary', ...)
  // 2026-10-19T23:59:59Z vs 2026-10-20T00:00:01Z, same ip and ua => different id
  // this is Review Focus item 4

test('is unchanged by local time zone', ...)
  // 2026-10-19T23:30:00Z expressed two ways => equal

test('returns 16 lowercase hex characters', ...)
  // /^[0-9a-f]{16}$/

test('differs when only the secret differs', ...)
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/analytics/session.test.ts`
Expected: FAIL, cannot resolve `./session`

- [ ] **Step 3: Implement `sessionId` in `src/lib/analytics/session.ts`**

HMAC-SHA256 from `node:crypto`. Key is `secret + UTC date as YYYY-MM-DD`, message is `ip + "\n" + userAgent`, output is the first 16 characters of the hex digest. Derive the date with `toISOString().slice(0, 10)` so it is UTC by construction rather than by local-time accident.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/analytics/session.test.ts`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/session.ts src/lib/analytics/session.test.ts
git commit -m "feat(analytics): derive a cookieless daily session id"
```

---

## Task 3: Classification

**Files:**
- Create: `src/lib/analytics/classify.ts`
- Test: `src/lib/analytics/classify.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `isBot(userAgent: string): boolean`
  - `deviceFromUserAgent(userAgent: string): 'desktop' | 'mobile' | 'tablet'`
  - `classifySource(referrer: string | null, utmSource: string | null): { source: string; referrerHost: string | null }`
  - `normalisePath(rawUrl: string): string`

- [ ] **Step 1: Write the failing tests**

```ts
describe('isBot')
  test('rejects the spec list', ...)      // bot, crawl, spider, slurp, headless,
                                          // lighthouse, curl, wget, preview, monitor
  test('matches case-insensitively', ...) // 'Googlebot/2.1'
  test('accepts an ordinary browser', ...) // a real Firefox UA string
  test('treats an empty user agent as a bot', ...)

describe('deviceFromUserAgent')
  test('buckets an iPhone as mobile', ...)
  test('buckets an iPad as tablet', ...)
  test('buckets an Android phone as mobile', ...)
  test('buckets a desktop as desktop', ...)
  test('falls back to desktop for an unrecognised agent', ...)

describe('classifySource')
  test('empty referrer is direct', ...)              // source 'direct', host null
  test('same-origin referrer is direct', ...)        // https://edwindev.cloud/blog
  test('linkedin.com is linkedin', ...)
  test('lnkd.in is linkedin', ...)
  test('www.google.fr is google', ...)
  test('google.co.uk is google', ...)
  test('malt.fr is malt', ...)
  test('an unknown host keeps its bare host', ...)   // news.ycombinator.com
  test('utm_source wins over the referrer', ...)
  test('a malformed referrer does not throw', ...)   // 'not a url' => direct

describe('normalisePath')
  test('strips the fr locale prefix', ...)           // /fr/blog => /blog
  test('strips the en locale prefix', ...)           // /en/blog => /blog
  test('leaves an unprefixed path alone', ...)
  test('maps a bare locale root to /', ...)          // /en => /
  test('drops the query string entirely', ...)       // /blog?utm_source=x => /blog
  test('drops the fragment', ...)
  test('does not mistake a path segment for a locale', ...) // /english-notes stays
  test('collapses a trailing slash', ...)            // /blog/ => /blog, / stays /
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/analytics/classify.test.ts`
Expected: FAIL, cannot resolve `./classify`

- [ ] **Step 3: Implement the four functions in `src/lib/analytics/classify.ts`**

Locale list comes from `routing.locales` in `src/i18n/routing.ts`; import it rather than hardcoding `['fr','en']`. `classifySource` and `normalisePath` parse with `URL` inside try/catch and fall back to `direct` and the raw string respectively.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/analytics/classify.test.ts`
Expected: PASS, 27 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/classify.ts src/lib/analytics/classify.test.ts
git commit -m "feat(analytics): classify source, device, path and bots"
```

---

## Task 4: Event construction and the collector route

**Files:**
- Create: `src/lib/analytics/event.ts`
- Create: `src/lib/analytics/db.ts`
- Create: `src/app/api/collect/route.ts`
- Test: `src/lib/analytics/event.test.ts`
- Modify: `package.json` (add `pg` and `@types/pg`)

**Interfaces:**
- Consumes: `sessionId` (Task 2), `isBot` / `deviceFromUserAgent` / `classifySource` / `normalisePath` (Task 3)
- Produces:
  - `type AnalyticsRow = { sessionId: string; kind: 'view' | 'click' | 'leave'; path: string; locale: string | null; country: string | null; source: string; referrerHost: string | null; device: string; element: string | null; dwellMs: number | null }`
  - `buildEvent(headers: Headers, body: unknown, now: Date, secret: string): AnalyticsRow | null` returning `null` for anything that must be dropped
  - `ensureSchema(): Promise<void>` and `insertEvent(row: AnalyticsRow): Promise<void>` from `db.ts`

- [ ] **Step 1: Write the failing tests for `buildEvent`**

```ts
test('builds a view row from a well-formed request', ...)
  // asserts every field, including country from CF-IPCountry

test('drops the event when CF-Connecting-IP is absent', ...)
  // returns null. Review Focus item 1

test('drops the event when the user agent is a bot', ...)

test('stores CF-IPCountry XX verbatim', ...)       // Review Focus item 5
test('stores CF-IPCountry T1 verbatim', ...)       // Review Focus item 5
test('leaves country null when the header is absent', ...)

test('rejects an unknown kind', ...)               // 'exfiltrate' => null
test('rejects a click with no element', ...)
test('truncates an over-long element name', ...)   // 200 chars => 64

test('clamps dwell_ms above the ceiling', ...)     // 3 days => 1800000 (30 min)
test('rejects a negative dwell_ms', ...)           // => null. Review Focus item 3
test('rejects a non-integer dwell_ms', ...)        // '12' and 1.5 => null
test('ignores dwell_ms on a view', ...)            // stored null

test('rejects a body that is not an object', ...)  // null, array, string => null
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/analytics/event.test.ts`
Expected: FAIL, cannot resolve `./event`

- [ ] **Step 3: Implement `buildEvent` in `src/lib/analytics/event.ts`**

Pure, no database, no I/O. Reads `cf-connecting-ip`, `cf-ipcountry`, `user-agent` and `referer` off the passed `Headers`. The dwell ceiling is 1,800,000 ms (30 minutes), matching the inactivity gap that bounds a visit, so a backgrounded tab cannot inflate panel 3. Element names cap at 64 characters.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/analytics/event.test.ts`
Expected: PASS, all tests

- [ ] **Step 5: Implement `src/lib/analytics/db.ts`**

`pg.Pool` with `max: 4`, sized for one replica. `ensureSchema()` runs the `CREATE TABLE IF NOT EXISTS` and the three `CREATE INDEX IF NOT EXISTS` statements from the spec's Data model section verbatim. `insertEvent(row)` is one parameterised `INSERT`. Connection from `ANALYTICS_DATABASE_URL`. If that variable is unset, both functions become no-ops and log once at startup, so a local `npm run dev` without a database still serves the site.

- [ ] **Step 6: Implement `src/app/api/collect/route.ts`**

`export async function POST(request: Request)`. Parse JSON in try/catch, call `buildEvent`, and if it returns a row call `insertEvent`. **Every path returns `new Response(null, { status: 204 })`, including every thrown error**, which is Review Focus item 2. Errors are logged with `console.error` and must never include the IP or the user agent. Add `export const runtime = 'nodejs'` since `pg` needs it. Rate limit per session id with an in-process `Map`: 300 events per rolling hour, dropped silently past that.

- [ ] **Step 7: Verify the route cannot throw**

Run: `npx vitest run src/lib/analytics` and `npm run build`
Expected: PASS, and a clean build.

- [ ] **Step 8: Commit**

```bash
git add src/lib/analytics/ src/app/api/collect/ package.json package-lock.json
git commit -m "feat(analytics): add the collector endpoint"
```

---

## Task 5: Client tracker

**Files:**
- Create: `src/lib/analytics/beacon.ts`
- Test: `src/lib/analytics/beacon.test.ts`
- Modify: `src/components/AnalyticsPageview.tsx`
- Modify: `src/lib/analytics.ts`

**Interfaces:**
- Consumes: `POST /api/collect` (Task 4)
- Produces: `send(event: { kind: 'view' | 'click' | 'leave'; path: string; locale?: string; referrer?: string; element?: string; dwellMs?: number }): void`, fire and forget, never throws.

- [ ] **Step 1: Write the failing tests for the dwell timer**

The timer is the only part with logic worth pinning, so extract it rather than testing React.

```ts
// exported from beacon.ts
// createDwellTimer(now: () => number): { visible(): void; hidden(): void; elapsed(): number }

test('counts time while visible', ...)
test('stops counting while hidden', ...)          // Review Focus item 3
test('resumes counting when visible again', ...)
test('reports zero before any visible period', ...)
test('never reports a negative elapsed time', ...) // clock moving backwards
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/analytics/beacon.test.ts`
Expected: FAIL, cannot resolve `./beacon`

- [ ] **Step 3: Implement `send` and `createDwellTimer` in `src/lib/analytics/beacon.ts`**

`send` uses `navigator.sendBeacon` when available and falls back to `fetch` with `keepalive: true`. Both are wrapped so nothing reaches the page. No-ops when `typeof window === 'undefined'`.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/analytics/beacon.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Wire the tracker into the app**

In `AnalyticsPageview.tsx`, alongside the existing `pageview()` call, send a `view` and start a dwell timer; on pathname change and on `visibilitychange` to hidden, send `leave` with the elapsed time. In `analytics.ts`, have `track()` also call `send({ kind: 'click', ... })` for `type === 'button'`, keeping the existing GA path untouched.

- [ ] **Step 6: Verify the whole suite and the build**

Run: `npm test && npm run lint && npm run build`
Expected: all pass, clean build.

- [ ] **Step 7: Commit**

```bash
git add src/lib/analytics/ src/components/AnalyticsPageview.tsx src/lib/analytics.ts
git commit -m "feat(analytics): send view, click and leave events"
```

---

## Task 6: Database, secrets and deployment

Nothing here is applied by hand. ArgoCD syncs it.

**Files:**
- Create: `deploy/postgres.yaml`
- Create: `deploy/retention-cronjob.yaml`
- Modify: `deploy/secrets.sops.yaml`, `deploy/deployment.yaml`, `deploy/kustomization.yaml`

**Interfaces:**
- Consumes: `ensureSchema` reads `ANALYTICS_DATABASE_URL` (Task 4)
- Produces: a reachable `portfolio-db-rw.portfolio.svc:5432`, and a read-only role whose password Task 7 consumes.

- [ ] **Step 1: Write `deploy/postgres.yaml`**

Copy the `hixels/deploy/postgres.yaml` shape: `instances: 1`, `storage.size: 5Gi`, requests `cpu: 100m` / `memory: 192Mi`, limit `memory: 384Mi` (below hixels because this database is tiny and the node is tight). Carry the `argocd.argoproj.io/sync-options: Prune=false` annotation and its comment: there are no backups. Declare the application database `analytics`, its owner role `portfolio_app`, and a second read-only role `grafana_ro` via `spec.managed.roles`. Each role draws its password from its own `kubernetes.io/basic-auth` Secret, `portfolio-db-app` and `portfolio-db-grafana-ro`, because that is the shape CNPG reads (it wants `username` and `password` keys); `portfolio-secrets` holds the application's environment, including the assembled `ANALYTICS_DATABASE_URL`, not the role passwords themselves. `grafana_ro` gets `CONNECT` on the database, `USAGE` on `public`, and `SELECT` on `analytics_event` only. These three names are fixed: Tasks 7 and 8 depend on them verbatim.

- [ ] **Step 2: Generate the secrets and encrypt them**

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
# generate three values with openssl rand -hex 32:
#   ANALYTICS_SALT_SECRET, the owner password, the read-only password
sops deploy/secrets.sops.yaml
```

Add `ANALYTICS_DATABASE_URL` too, pointing at `portfolio-db-rw.portfolio.svc:5432/analytics`. Verify no plaintext reaches git: `git diff --cached | grep -i -E 'password|secret' | grep -v ENC` must print nothing before committing.

- [ ] **Step 3: Write `deploy/retention-cronjob.yaml`**

A nightly `CronJob` running `psql` from the CNPG image, deleting rows where `at < now() - interval '24 months'`. Schedule `17 3 * * *`. `concurrencyPolicy: Forbid`, `successfulJobsHistoryLimit: 1`.

- [ ] **Step 4: Register everything and raise the memory limit**

Add both files to `deploy/kustomization.yaml` resources. In `deployment.yaml`, raise the container memory limit from `256Mi` to `320Mi` for the `pg` pool, bump the `secrets-version` annotation so the pods roll, and leave requests at `128Mi`.

- [ ] **Step 5: Verify the manifests render**

Run: `cd deploy && kustomize build --enable-alpha-plugins --enable-exec . > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add deploy/
git commit -m "feat(deploy): add portfolio-db and analytics retention"
```

---

## Task 7: Grafana datasource

**Files:**
- Create: `stini-cluster/argocd/monitoring/analytics-db-secret.sops.yaml`
- Modify: `stini-cluster/argocd/monitoring/kustomization.yaml`
- Modify: `stini-cluster/argocd/base/apps/grafana.yaml`

**Interfaces:**
- Consumes: the read-only password from Task 6, the same value
- Produces: a Grafana datasource with uid `portfolio-analytics` that Task 8 queries

- [ ] **Step 1: Encrypt the read-only password into the monitoring namespace**

The value must be the one Task 6 already generated, and it must never be pasted anywhere. Read it from the portfolio worktree with `sops -d` and pipe it straight into the new SOPS file for this repo:

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
# read the grafana_ro password out of the portfolio repo's encrypted secret,
# write it into a Secret named analytics-db-readonly (key: password) in the
# monitoring namespace, and encrypt that file in place with sops.
```

Do not print the value, do not include it in your report, and do not write it to any unencrypted file. Register the new file in the monitoring `kustomization.yaml` secret generator beside the existing one.

- [ ] **Step 2: Add the datasource and the env block to `grafana.yaml`**

A second entry under `datasources.datasources.yaml.datasources`: type `grafana-postgresql-datasource`, uid `portfolio-analytics`, url `portfolio-db-rw.portfolio.svc:5432`, database `analytics`, user `grafana_ro`, `secureJsonData.password: $ANALYTICS_DB_PASSWORD`, `jsonData.sslmode: require`, and `isDefault` absent so VictoriaMetrics stays default. Then add an `env` block to the Helm `valuesObject` reading `ANALYTICS_DB_PASSWORD` from that Secret. No `env` block exists today, so this is a new key.

- [ ] **Step 3: Verify the manifests render and no plaintext leaked**

Run: `cd stini-cluster && export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt" && kustomize build argocd/base > /dev/null && kustomize build --enable-alpha-plugins --enable-exec argocd/monitoring > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add argocd/
git commit -m "feat(monitoring): add the portfolio analytics datasource"
```

---

## Task 8: The dashboard

**Files:**
- Create: `stini-cluster/argocd/monitoring/dashboards/portfolio-analytics.json`
- Modify: `stini-cluster/argocd/monitoring/kustomization.yaml`

**Interfaces:**
- Consumes: datasource uid `portfolio-analytics` (Task 7), the `analytics_event` schema (Task 6)
- Produces: nothing

- [ ] **Step 1: Write the visit-boundary SQL once and reuse it**

Every panel that says "visit" depends on it, so get it right in one place: a CTE that marks a new visit whenever `at - lag(at) over (partition by session_id order by at) > interval '30 minutes'`, then a running sum of those marks as the visit number. Panels 2, 4, 6 and 10 build on it. Panels 1, 3, 5, 7, 8, 9, 11, 12 and 13 do not need it.

- [ ] **Step 2: Author the thirteen panels**

Follow the spec's panel table and the approved mockup, uid `portfolio-analytics`, title "Portfolio Visitors", tag `portfolio`, default range `now-14d`, `timezone: browser`, `schemaVersion: 39` to match `hixels-server.json`. Panel 4 is visits with exactly one view, not sessions. Panel 10 aggregates the path sequence in SQL with `string_agg(path, ' -> ' order by at)`, not a Grafana transformation, so the panel stays readable.

- [ ] **Step 3: Validate the JSON**

Run: `jq -e '.panels | length == 13' stini-cluster/argocd/monitoring/dashboards/portfolio-analytics.json`
Expected: `true`

- [ ] **Step 4: Register in the ConfigMap generator**

Add the file to `configMapGenerator.files` in the monitoring kustomization, beside `hixels-server.json`.

- [ ] **Step 5: Verify it renders**

Run: `cd stini-cluster && export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt" && kustomize build --enable-alpha-plugins --enable-exec argocd/monitoring > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add argocd/monitoring/
git commit -m "feat(monitoring): add the portfolio visitors dashboard"
```

---

## Task 9: Deploy and verify live

The spec makes this a completion criterion, not a formality. The IP handling fails silently when wrong, so the dashboard is not trusted until this passes.

**Files:** none

- [ ] **Step 1: Push both repos in order**

Portfolio first (CI builds the image and commits the tag back), then `stini-cluster`. Confirm ArgoCD syncs both and `portfolio-db-1` reaches `Ready`.

- [ ] **Step 2: Confirm the schema exists**

Query `analytics_event` through the read-only role and confirm the table and three indexes are present.

- [ ] **Step 3: Verify distinct visitors get distinct session ids**

Visit the live site from two networks that differ (for example a laptop on wifi and a phone on mobile data), then check that the two visits produced **two different** `session_id` values. One shared value means `CF-Connecting-IP` is not arriving and the collector is reading a Cloudflare edge address. This is the check the whole design hinges on.

- [ ] **Step 4: Confirm no IP or user agent reached the database or the logs**

Run a column-by-column look at a few rows, and grep the pod logs for a dotted quad and for `Mozilla`.

- [ ] **Step 5: Confirm the site is unaffected when the database is down**

Scale `portfolio-db` to zero instances through git, confirm the site still serves and `/api/collect` still returns 204, then restore. This exercises Review Focus item 2 against the real deployment rather than a unit test.

- [ ] **Step 6: Check node memory after the new Postgres instance**

`kubectl top node`. If memory moved materially above the 66% baseline, say so rather than leaving it for later.

- [ ] **Step 7: Record the GA comparison date**

Note in the spec the date one month out when GA's visitor count gets compared with panel 1, so the retirement step in the spec has an owner and a date.

---

## Self-Review Notes

- **Spec coverage:** every section maps to a task. The client tracker is Task 5, the collector Task 4, the database Task 6, the dashboard Tasks 7 and 8, VM retention Task 1, retention delete Task 6 step 3, live verification Task 9. The "Retiring GA" section is deliberately not implemented: the spec defers it a month, and Task 9 step 7 schedules it.
- **Type consistency:** `AnalyticsRow` is defined once in Task 4 and consumed by `insertEvent` and the route. `sessionId` and the four classify functions keep the names given in Tasks 2 and 3.
- **Not covered by tests, by choice:** the Postgres layer itself. A silently skipping integration test is worse than none, so `db.ts` is kept thin enough to read and is verified by Task 9 against the real deployment.
