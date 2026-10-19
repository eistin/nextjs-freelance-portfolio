# First-party portfolio analytics, read in Grafana

Design document. 2026-10-19.

## Intent

Edwin wants to understand what visitors do on edwindev.cloud: where they arrive
from, how long they stay, what they click, and which page they leave on. Today
that question is answered by Google Analytics 4 (property `G-QQ3GP98E89`), which
has three problems:

1. **It is another dashboard to log into.** Everything else about the cluster is
   already in Grafana at `grafana.edwindev.cloud`.
2. **Its interface cannot be shaped.** The GA4 reports are fixed, dense, and
   mostly about things a one-person freelance site does not care about.
3. **It undercounts.** GA loads a script from `googletagmanager.com`, which every
   ad blocker blocks by default. The site's audience is DevOps and SRE people,
   among the heaviest ad-blocker users there are, so an unknown but probably
   large fraction of real visits never reach GA at all. Nothing inside GA can
   reveal the size of that gap.

The fix is to collect the events ourselves, from our own domain, store them in
the cluster, and read them in Grafana.

### Why first-party collection solves the counting problem

A request to `edwindev.cloud/api/collect` is same-origin, is not on any
blocklist, and is indistinguishable from the site working normally. Blocked
visitors get counted. That is the whole mechanism.

## Goals

- One dashboard, in the Grafana that already exists, answering: where visitors
  come from, which pages they read and for how long, what they click, where they
  leave, and what a single visit looked like end to end.
- Counts that include ad-blocking visitors.
- No consent banner required, which means no cookies and no stored IP addresses.
- Data stays on the cluster.
- Fits the existing €20/month ceiling. This costs one new Hetzner volume, about
  €0.50/month, taking spend from roughly €9 to €9.50 (Edwin's call, 2026-10-19).

## Non-goals

- Replacing GA on day one. GA keeps running untouched so the two can be compared
  once, by hand, after about a month. See "Retiring GA" below.
- A heatmap of mouse positions. Explicitly considered and declined in favour of a
  ranked list of clicked elements.
- Cross-visit identity. We will never know that today's visitor is the same
  person as last week's visitor, and we do not want to.
- Real-time. A dashboard that is a minute or two behind is fine.
- Multi-site. This serves edwindev.cloud only.

## Anti-goals

Things that would make this a failure even if it technically worked:

- **Any design that needs a cookie banner.** The point is to be lighter than GA,
  not to add friction to a site whose job is to win freelance contracts.
- **Storing anything that identifies a person.** No IP addresses at rest, no raw
  user agents, no persistent visitor id.
- **A collector that can break the website.** If the database is down, the
  analytics call must fail silently and the page must render normally.
- **A second thing to log into.** If the answer involves opening anything other
  than Grafana, it has missed the point.

## Constraints

- Single node (cx33, 8 GB), currently at 66% memory. Two CNPG clusters already
  run on it (`hixels-db`, `prospection-db`).
- `stini-cluster` is IaC-only: no `kubectl apply` against the cluster, everything
  through git-committed ArgoCD manifests. Secrets only via SOPS.
- The portfolio deploys from its own repo's `deploy/` path, synced by the
  `portfolio` ArgoCD Application. Its image is built by
  `.github/workflows/deploy.yml` and the tag is committed back by CI.
- The portfolio runs **one** replica. In-process state is therefore safe, but the
  design should not silently break if that ever becomes two.
- Grafana 13.7.0, provisioned by Helm values in
  `stini-cluster/argocd/base/apps/grafana.yaml`. Dashboards are JSON files in
  `stini-cluster/argocd/monitoring/dashboards/` surfaced through the
  `grafana-dashboards-custom` ConfigMap.

## Shape of the solution

```
browser                     portfolio pod                  CNPG                Grafana
───────                     ─────────────                  ────                ───────
page view      ──POST──►    /api/collect  ──INSERT──►   portfolio-db  ◄──SQL──  dashboard
click          ──POST──►    (classify,                  analytics_event
page leave     ─beacon─►     derive, drop IP)
```

Four pieces:

1. **A client tracker** in the Next.js app that emits view, click, and leave
   events.
2. **A collector endpoint** (`/api/collect`) that classifies and stores them,
   deriving device and a daily session id, then discarding the IP.
3. **A Postgres database** (`portfolio-db`, a new single-instance CNPG cluster).
4. **A Grafana dashboard** reading that database through a read-only Postgres
   datasource.

VictoriaMetrics is deliberately **not** in this path. It stores counters and
cannot answer "what did this visit look like", which is the question being asked.
VM keeps doing infra metrics.

## Data model

One table. At the site's volume (roughly 1,000 views per fortnight) this is about
30,000 rows a year, so no rollups, no partitioning, no aggregation tables.

```sql
CREATE TABLE IF NOT EXISTS analytics_event (
  id            bigserial PRIMARY KEY,
  at            timestamptz NOT NULL DEFAULT now(),
  session_id    text        NOT NULL,   -- daily-rotating, derived, never reversible
  kind          text        NOT NULL,   -- 'view' | 'click' | 'leave'
  path          text        NOT NULL,   -- locale-stripped, e.g. /projects/equativ-central-migration
  locale        text,                   -- 'fr' | 'en'
  country       char(2),                -- ISO-3166-1 alpha-2, from the CF-IPCountry header
  source        text,                   -- 'linkedin' | 'google' | 'direct' | 'malt' | host | 'other'
  referrer_host text,                   -- raw host, null when direct or same-origin
  device        text,                   -- 'desktop' | 'mobile' | 'tablet'
  element       text,                   -- kind='click' only, e.g. 'hero_cta'
  dwell_ms      integer                 -- kind='leave' only, visible time on that page
);

CREATE INDEX ON analytics_event (at DESC);
CREATE INDEX ON analytics_event (session_id, at);
CREATE INDEX ON analytics_event (kind, at DESC);
```

The table is created idempotently at app start. With one replica there is no
race; the `IF NOT EXISTS` keeps it safe if that changes.

### Where the client IP comes from

**The pod never sees the visitor's IP.** `edwindev.cloud` is Cloudflare-proxied
(`--cloudflare-proxied` in `stini-cluster/argocd/base/apps/external-dns.yaml`,
confirmed live by `server: cloudflare` and a `cf-ray` header), and PROXY protocol
is disabled on the Cilium Gateway
(`cilium_gateway_api_proxy_protocol_enabled = false`). The TCP peer address is a
Cloudflare edge IP.

This is the single most dangerous thing in the build, because getting it wrong
fails silently: every visitor through the same Cloudflare PoP would collapse into
one `session_id`, and panels 1, 2, 4, 9 and 10 would show believable, wrong
numbers with no error anywhere.

Decided (builder's call):

- The authoritative source is the **`CF-Connecting-IP`** header. Cloudflare sets
  it on every proxied request and strips any client-supplied copy, so it cannot
  be spoofed from outside. `X-Forwarded-For` is not used: its correct index
  depends on hop count and is easy to get wrong.
- If `CF-Connecting-IP` is **absent**, the event is **dropped** rather than
  bucketed. An absent header means the request did not come through Cloudflare,
  which at that point means either a direct-to-origin probe or a
  misconfiguration, and neither should become a visitor.
- **A live verification step is in scope and is a completion criterion.** There
  is no staging environment, so after the first deploy, confirm against real
  traffic that distinct visitors produce distinct `session_id` values. A dashboard
  that has not had this check is not trusted.

### Session identification without cookies

```
session_id = hex( HMAC-SHA256( key = ANALYTICS_SALT_SECRET + UTC date,
                               msg = client IP + user agent ) )[0:16]
```

Properties that matter:

- **No cookie, no localStorage.** Nothing is written to the visitor's device.
- **Rotates daily.** The same person tomorrow is a different `session_id`, so
  visits cannot be joined across days. This is what keeps it out of
  consent-banner territory and it is the same approach Plausible uses.
- **Survives pod restarts**, because the salt is derived from a secret plus the
  date rather than generated in memory.
- **Not reversible.** The IP is used to compute the hash and is then discarded.
  It is never written to the database or to logs.

`ANALYTICS_SALT_SECRET` is a new SOPS-encrypted value in the portfolio's existing
`deploy/secrets.sops.yaml`.

Two people behind the same office NAT, on the same phone model and browser
version, collapse into one `session_id`. At this site's volume that is accepted
and not mitigated.

### A session id is not a visit

`session_id` identifies a **person-day**, not a visit. Someone who reads at 09:00
and returns at 18:00 shares one `session_id`, and a naive panel 10 would render
that as a single nine-hour visit splicing two unrelated journeys together.

Decided (builder's call): **visits are derived in SQL by a 30-minute inactivity
gap** within a `session_id`. Thirty minutes is the conventional boundary and it
makes "visit" mean what it ordinarily means, which is what the panel titles
promise. Concretely, a new visit starts whenever the gap since the previous event
in the same `session_id` exceeds 30 minutes.

This changes panel 4's definition from the naive one: it is visits with exactly
one `view`, not sessions with exactly one `view`.

### What is deliberately not stored

Raw IP, raw user agent, any cookie, any cross-day identifier, form field
contents, and the query string in full (campaign parameters are read for `source`
classification and then discarded, per the collector steps above).

## The client tracker

Builds on what already exists. `src/lib/analytics.ts` already tracks button
clicks, section views, and form events, and `src/components/AnalyticsPageview.tsx`
(added 2026-10-18) already fires on every route change including soft
navigations. Both get a second destination rather than a rewrite.

Three event kinds:

- **view**: on first load and on every client-side route change. Carries path,
  locale, and `document.referrer`.
- **click**: on named elements only; any element without a name is not tracked.
  Instrumentation is thin and that is a known gap rather than an oversight. At
  the time of writing the named elements are the three contact links
  (`linkedin`, `github`, `downloadCv`), the hero's primary call to action
  (`hero_cta`), and the contact form, whose `trackFormEvent` calls reach the
  collector as `form_submit` and `form_error`. The navigation, the project
  cards and the blog links are deliberately not instrumented yet, so panel 8
  reads as incomplete coverage rather than as absent engagement.
- **leave**: when the page is hidden or replaced, carrying visible time on that
  page. Sent with `navigator.sendBeacon` so it survives unload. Visible time
  accumulates only while `document.visibilityState === 'visible'`, so a tab left
  open in the background does not inflate the number.

The tracker must never block rendering and never throw into the page. A failed
collect call is swallowed.

## The collector

`POST /api/collect`, a Next.js route handler. `src/middleware.ts` already
excludes `/api` from the i18n middleware, so no routing change is needed.

Per request, in order:

1. **Reject bots** by user-agent pattern (`bot`, `crawl`, `spider`, `slurp`,
   `headless`, `lighthouse`, `curl`, `wget`, `preview`, `monitor`). Dropped
   silently with 204.
2. **Derive `session_id`** per the formula above.
3. **Read `country`** from the `CF-IPCountry` header, storing its value verbatim
   including `XX` (unplaceable) and `T1` (Tor). See below.
4. **Derive `device`** from the user agent, into three buckets only.
5. **Classify `source`** from the referrer and any `utm_source`:
   - same-origin or empty referrer becomes `direct`
   - `*.linkedin.com`, `lnkd.in` become `linkedin`
   - `google.*` becomes `google`
   - `malt.fr` becomes `malt`
   - anything else keeps its bare host, so new sources appear by themselves
     without a code change
6. **Normalise `path`**: strip the locale prefix so `/en/blog` and `/blog` are the
   same page, and drop the query string except for the campaign parameters.
7. **Insert** and return 204.

Hard requirement: every failure path returns 204 and logs server-side. The
website must not degrade because analytics is broken.

Rate limiting: a simple per-`session_id` ceiling (a few hundred events an hour)
to stop a loop or a bad actor filling the disk.

### Country, from a header that is already there

Because the zone is Cloudflare-proxied, **`CF-IPCountry`** arrives on every
request with a two-letter country code. Read it and store it. No account, no
licence key, no database file in the image, no refresh job, and no new third
party, since Cloudflare is already terminating every request.

Store the header's value only. The IP it was derived from is still discarded, so
the privacy position is unchanged.

Two values need handling: `XX` for an IP Cloudflare cannot place, and `T1` for
Tor. Both are stored as-is rather than nulled, because "unknown" is a real answer.

*(An earlier revision of this document dropped the country panel on the belief
that it required MaxMind GeoLite2, an account, a key in SOPS and a 6 MB file in
the image. That was wrong: it mattered only if Cloudflare were not in the path.
Approximating country from `Accept-Language` remains rejected, since that
measures keyboard layout rather than location.)*

## The database

A new CNPG cluster, `portfolio-db`, in the `portfolio` namespace, following the
existing `hixels-db` pattern: one instance, modest requests, its own PVC.

Decided by Edwin, 2026-10-19, with the alternative on the table: an analytics
database inside the existing `hixels-db` would have avoided both the volume and
a third Postgres instance, at the cost of coupling the portfolio's analytics to
the game's database. Isolation won. The build must therefore respect the two
constraints that made the other option tempting:

- **RAM is the binding constraint, not euros.** The node is at 66% memory with
  limits already 134% overcommitted. Size this cluster's requests conservatively
  and check the node after it lands.
- The new volume takes spend to roughly €9.50/month against the €20 ceiling.

Two roles: the app's read-write user, and a **read-only** user for Grafana. The
Grafana datasource must not be able to write.

**The manifest lives in the portfolio repo**, at `deploy/postgres.yaml`, following
the `hixels/deploy/postgres.yaml` precedent, synced by the existing `portfolio`
ArgoCD Application.

The credential path across the two repos matters, because
`nextjs-freelance-portfolio` is **public** and `stini-cluster` is private. Decided
(builder's call):

- The read-only role's password is generated and stored SOPS-encrypted in the
  portfolio repo's `deploy/secrets.sops.yaml`. SOPS ciphertext in a public repo is
  the same exposure as elsewhere in this setup, so this adds no new risk, but no
  plaintext password may ever reach that repo.
- The same value is SOPS-encrypted into a Secret in the `monitoring` namespace in
  `stini-cluster`.
- The Grafana datasource reads it through `secureJsonData` with `$ANALYTICS_DB_PASSWORD`,
  which requires adding an `env` / `envValueFrom` block to the Grafana Helm
  `valuesObject`. No such block exists today, so this is a new addition to
  `grafana.yaml`, not an edit to an existing one.
- Rotation means changing the value in both repos in one commit each. There is no
  automation for this and none is being built.

Notes for whoever builds it:

- `hixels-db` runs with no NetworkPolicy and works. `prospection-db` has one and
  is currently reporting `Instance Status Extraction Error`. Do not add a
  NetworkPolicy here unless there is a reason; if one is ever added, it needs to
  allow the operator, Grafana from the `monitoring` namespace on 5432, and 9187
  for metrics scraping.
- Backups: `prospection-db` has none, and that is a known gap rather than a
  pattern to copy. Analytics data is not precious, so no backup is acceptable
  here, but it should be a decision written down rather than an oversight.

## How long events are kept

Decided (builder's call): rows are deleted after **24 months**, by a nightly
delete.

This is not a storage decision, since 30,000 rows a year is nothing. It is part
of the privacy position: the CNIL exemption the design leans on expects a bounded
retention, and the figure usually cited alongside it is 25 months. Twenty-four
months sits inside that and is a round number.

Without this, rows accumulate forever and the privacy argument below quietly
stops being true.

## The dashboard

A new `portfolio-analytics.json` in
`stini-cluster/argocd/monitoring/dashboards/`, registered in that directory's
kustomization the same way `hixels-server.json` is, and a new Postgres datasource
added to the `datasources.yaml` block in `grafana.yaml`.

Panels, as approved from the mockup. All thirteen are built; the numbering matches
the mockup so the two can be read side by side.

| # | Panel | Source |
|---|-------|--------|
| 1 | Visitors | `count(distinct session_id)` where kind='view' |
| 2 | Page views | `count(*)` where kind='view', plus pages per visit |
| 3 | Median time on page | median `dwell_ms` where kind='leave' |
| 4 | Left on first page | sessions with exactly one view, as a share |
| 5 | Page views per day | time series, with the annotation that spikes are explainable |
| 6 | Where they come from | by `source`, with visitors and average pages |
| 7 | Top pages | by `path`, views and median time |
| 8 | Most clicked | by `element`, clicks and clicks as a share of views |
| 9 | Last page before leaving | last view per session |
| 10 | Recent visits | one row per session: time, source, path sequence, duration |
| 11 | Countries | by `country` |
| 12 | Device | by `device` |
| 13 | Language served | by `locale` |

Panel 10 is the one that justifies the whole design. A row reading
`malt.fr → / → /recent-work → /projects/equativ-gcp-landing-zone → /contact,
7m03s` is a lead reading the work and then going to the contact page, and no
counter-based store can produce it.

### Panel 4, defined

"Left on first page" is **sessions with exactly one `view` event**, as a
percentage of sessions. It is deliberately not called bounce rate and carries no
time threshold: someone who reads one blog post for four minutes and leaves
satisfied counts as having left on the first page, and that is correct. The
number is a prompt to look at panel 7, not a verdict.

*(Builder's call, flagged to Edwin: a time threshold was considered and dropped
to keep the number honest.)*

## VictoriaMetrics retention

Separate from the above and requested alongside it: raise `retentionPeriod` in
`stini-cluster/argocd/base/apps/victoria-metrics.yaml` from `30d` to `90d`.

Measured on the live cluster on 2026-10-19: 46,607 active series, roughly 2,900
samples/sec, 205 MB on disk after about 4 days, so about 51 MB/day. Ninety days
extrapolates to roughly 4.6 GB against 9.5 GB available on the existing volume.
No volume resize, no Hetzner change, no RAM change (VictoriaMetrics scales memory
with active series, not retention).

The sizing comment above that value in the manifest says "~2 GB expected for 30d"
and must be updated in the same commit, or it will mislead the next reader.

This is not retroactive: history older than the current 30-day window is already
gone.

## Live verification, 2026-10-19

Deployed and checked against the real cluster on the day of the merge:

- `portfolio-db` healthy, schema created by the app on first request:
  `analytics_event` plus all three indexes.
- A request through Cloudflare returned 204 and wrote one row. **The row
  existing at all proves `CF-Connecting-IP` arrived**, because the collector
  drops the event when that header is absent.
- `country` came back as `FR`, so Cloudflare IP Geolocation is enabled on the
  zone and panel 11 has data. This was an open question at design time.
- No IP and no user agent in any column, checked by regex across every text
  field of the row.
- `grafana_ro` on the live database: `SELECT` works, `INSERT` and `DELETE` are
  both refused. The `ALTER DEFAULT PRIVILEGES` ordering works against a table
  created later by `portfolio_app`, as it did in the pre-merge Docker test.
- Grafana holds `ANALYTICS_DB_PASSWORD` in its environment and logged
  `inserting datasource from configuration name=portfolio-analytics`.
- Node memory 66% to 68% after adding a third Postgres instance. The portfolio
  pod measures **79Mi against its 320Mi limit** with the `pg` pool loaded, so
  that limit is generous rather than tight.

**Still owed:** the two-network session id check. Visiting from two different
networks must produce two different `session_id` values. Everything above is
consistent with it passing, but until it is done, panel 1 is unverified rather
than trusted.

## Retiring GA

GA stays exactly as it is for now, which costs nothing because it already works.

**Compare on or after 2026-11-19**, one month after the merge. Then:

1. Compare GA's **users** against panel 1 **visitors** for the same month. Do
   NOT compare page views: the GA tag fires a `page_view` on query-string
   changes while the first-party tracker deliberately does not, since
   `normalisePath` strips the query and firing twice would double-count every
   UTM-tagged arrival. Comparing page views would understate the ad-blocked
   fraction for reasons unrelated to ad blocking.
2. Then remove GA: the inline shim and `<Script>` in
   `src/app/[locale]/layout.tsx`, `src/lib/gtag.ts`, its tests, the GA branch of
   `src/lib/analytics.ts`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` from the Dockerfile,
   the deploy workflow, and `deploy/kustomization.yaml`, and the `gtag` npm
   dependency.

Removing GA also removes the only reason the site would ever need a cookie
banner.

## Privacy position

Written down so the reasoning survives.

The CNIL exempts audience measurement from consent when it is strictly necessary
to providing the service, limited to anonymous statistics, not cross-referenced
with other data, and not used to track people across sites. This design is built
to sit inside that exemption: no cookie or device storage, no IP at rest, an
identifier that cannot span a day boundary, one site only, no third party
receiving anything.

The part of this that is a judgement rather than a fact is whether a
daily-rotating derived id counts as anonymous. The reasoning: it is not
reversible to an IP, it cannot be joined to anything outside the table, and it
expires within 24 hours. That is the same basis Plausible publishes for the same
mechanism. It should be re-examined if the design ever grows a longer-lived
identifier, because that is the change that would break it.

## What is left to the builder

- Table creation mechanism (app-start migration versus CNPG `postInitApplicationSQL`).
- Postgres client and pool sizing for a single replica.
- The exact bot pattern list, and whether to also drop known cloud-provider ranges.
- Whether `leave` events batch or send individually.
- Dashboard JSON authoring, including whether panel 10 uses a Grafana table
  transformation or does the path aggregation in SQL.
- CNPG resource requests, sized against a node already at 66% memory.
- Whether the collector writes synchronously or queues in memory and flushes.
- The portfolio pod's memory limit is `256Mi` today and this adds a Postgres
  pool to it. Raising it is in scope, but the node is tight, so raise it by the
  smallest amount that measurement justifies rather than by a round guess.
