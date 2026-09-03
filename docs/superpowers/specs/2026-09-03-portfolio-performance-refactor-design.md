# Portfolio Performance & Clean-Code Refactor — Design

**Date:** 2026-09-03
**Status:** Approved for planning
**Scope:** Full audit + refactor (measured before/after, image + bundle optimization, Server Component conversion, file splitting, font optimization, written report)

## Problem

The homepage loads slowly. Investigation found the cause is almost entirely
**asset weight and client-bundle weight**, not server latency (recent commits
already added static generation and CDN cache headers).

Confirmed findings:

1. **`public/photo.svg` is 1.4 MB.** It is not a vector — it is a raster photo
   base64-embedded inside an SVG `<pattern>` fill. Next.js does not optimize
   SVGs, so the full 1.4 MB ships unoptimized. It is the hero LCP image
   (`priority`, `fetchPriority="high"`) and is loaded a **second time** by
   `AboutSection` at 400×400. Single biggest cause of slow loading.
2. **All 7 homepage sections are `"use client"` + Framer Motion.** Framer Motion
   (~50 KB gzipped) plus every section's logic ships to the browser, and no
   section content is server-rendered. Most sections use `motion` only for
   entrance/scroll fades. Only a few pieces need the client: the `ServicesSection`
   card click (`useService` context), the `TestimonialsSection` Radix `Dialog`,
   the `ContactSection` form, and the `StoriesSection` carousel.
3. **`ContactSection.tsx` is 439 lines** — form + validation + layout in one file.
4. **Fonts are 4 `.otf` weights** — `.woff2` is smaller and faster.

Existing infrastructure we can build on: `globals.css` already defines
`fade-in-up`, `fade-in-scale`, `scroll`, `scroll-mobile` keyframes and imports
`tw-animate-css`. The `logo.svg` (4.4 KB) Header preload is legitimate.

## Goals

- Cut homepage transferred bytes dramatically (target: hero image 1.4 MB → <50 KB).
- Remove Framer Motion from the critical path; ship less JS.
- Move presentational content to Server Components.
- Improve code clarity (split oversized files, clear client/server boundaries).
- Produce a written before/after report with real measurements.

## Non-Goals

- Redesigning the visual identity. Fades and layout stay; only spring-physics
  hover effects simplify to CSS transitions (approved).
- Changing content, copy, i18n structure, routing, or the contact backend.
- Refactoring unrelated code not touched by the above.

## Design

### Area 1 — Fix the hero image (highest impact)

- Extract the embedded raster from `public/photo.svg`: parse the `xlink:href`
  `data:` URI inside the pattern, base64-decode it to its native format
  (PNG/JPEG), and write `public/photo.<ext>`.
- Inspect dimensions. If much larger than needed (display max ~400px), downscale
  to ~800px (2× for retina) using `sharp` (install as a devDependency if the
  embedded image is oversized; skip if already small). Prefer keeping a single
  optimized source and letting `next/image` generate AVIF/WebP responsive sizes.
- Repoint `HeroSection` (192×192, `priority`) and `AboutSection` (400×400) at the
  new raster via `next/image`. Next then serves optimized AVIF/WebP.
- Delete `public/photo.svg` once nothing references it.

**Expected:** ~1.4 MB → ~20–40 KB per load, and the LCP image gets a proper
`next/image`-generated preload.

### Area 2 — Preload correctness

- `next/image` with `priority` auto-injects an LCP preload, so once the hero photo
  is a real raster the manual step is largely handled.
- Keep the `logo.svg` preload (it is the above-the-fold Header logo) OR verify via
  the build whether it is still the LCP; adjust only if measurement shows it is not
  helping. Do not preload assets that are not the LCP.

### Area 3 — Remove Framer Motion → CSS + `<Reveal>`

- Add `src/components/ui/Reveal.tsx`: a small `"use client"` wrapper using a single
  `IntersectionObserver` that toggles a CSS class (reusing existing `fade-in-up`
  keyframes) when the element scrolls into view (`once: true`, `-100px` margin — to
  match current `useInView` behavior). ~15–25 lines. Supports an optional stagger
  delay prop for grids.
- Convert to **Server Components** by removing `"use client"`, Framer Motion, and
  `useRef`/`useInView`, wrapping animated blocks in `<Reveal>`:
  - `HeroSection` — replace the CTA `onClick` scroll with an anchor `href="#contact"`
    (or a tiny client CTA leaf if smooth-scroll must be preserved); carousel already
    uses CSS. Swap `useTranslations` → server `getTranslations`.
  - `RecentWorkSection` — pass `locale` via props instead of `useParams`.
  - `AboutSection` — pure presentational; CSS reveal.
- Extract genuinely-interactive **client leaves**, keeping their parent sections as
  Server Components:
  - `ServiceCard` (client) — owns the `useService` click; `ServicesSection` becomes
    server and maps data to `<ServiceCard>`.
  - `TestimonialCard` (client) — owns the Radix `Dialog`; `TestimonialsSection`
    becomes server and renders the CSS carousel of `<TestimonialCard>`.
- `ContactSection` and `StoriesSection` stay client (form / carousel state) but drop
  Framer Motion in favor of CSS/`<Reveal>` where it only animated entrances.
- Uninstall `framer-motion` once no imports remain (verify with a repo-wide grep).

Sections read translations server-side via `getTranslations`; client leaves receive
already-translated strings as props (or use `useTranslations`, still available under
`NextIntlClientProvider`).

### Area 4 — Split oversized files

- `ContactSection.tsx` (439 lines) → separate the form (client, with validation/
  submit) from presentational layout; extract field config if it clarifies.
- Review `StoriesSection.tsx` (298 lines) and `app/[locale]/blog/[slug]/page.tsx`
  (311 lines) for the same treatment — split only where it improves clarity, no
  gratuitous fragmentation.

### Area 5 — Font optimization

- Convert the 4 Archiv Grotesk `.otf` weights to `.woff2`; update the `localFont`
  `src` paths in `layout.tsx`. Keep `display: "swap"`, `preload: true`, existing
  fallbacks. Remove the `.otf` files once unused.

### Area 6 — Measurement (before/after)

- **Before:** run `next build`; record First Load JS per route and the homepage
  transfer size / LCP asset. Capture a Lighthouse or manual load measurement.
- **After:** repeat with identical method. Record deltas.

### Area 7 — Written report

- `docs/superpowers/specs/2026-09-03-portfolio-performance-report.md` (or similar):
  findings, before/after numbers, what changed and why. Commit to git.

## Data Flow

Homepage (`app/[locale]/page.tsx`, static) fetches `projects` + `testimonials`
server-side (unchanged) and renders Server Component sections that stream HTML.
Client leaves (`ServiceCard`, `TestimonialCard`, contact form, `<Reveal>`,
`StoriesSection`) hydrate independently. No new data sources or fetching patterns.

## Error Handling / Risk

- **Image extraction** could yield an oversized or wrong-format raster — verify
  dimensions and visual parity before deleting `photo.svg`.
- **Server/client boundary mistakes** (event handler or hook in a Server Component)
  surface at build time — the production build must pass clean.
- **Animation parity** — reveals should match current timing/trigger closely; visual
  check after conversion.
- **i18n in Server Components** — use `getTranslations` server-side; ensure client
  leaves still receive their strings.

## Testing / Verification

- `npm run build` passes with no client/server boundary errors.
- `npm run lint` passes.
- Repo-wide grep confirms `framer-motion` fully removed before uninstall.
- Manual visual pass on `/en` and `/fr`: hero, services, work, testimonials
  (incl. dialog), about, contact, stories — animations and interactivity intact.
- Before/after build metrics captured and documented.

## Rollout

Single feature branch (current `eistin/Portfolio-nextjs`). Ordered so each step is
independently verifiable, image fix first (largest, lowest-risk win).
