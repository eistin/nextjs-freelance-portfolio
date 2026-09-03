# Portfolio Performance Refactor Report

## Baseline (before)

**Hero Asset Weight:**
- `public/photo.svg`: 1.5 MB

**Production Build Metrics:**
- Homepage `/[locale]` First Load JS: 208 kB
- First Load JS shared by all: 101 kB

## Results (after)

**Measured via `npm run build` (Next.js 15.3.3 production build) on 2026-09-03.**

| Metric | Before | After | Change |
|---|---|---|---|
| Hero image weight (`photo.svg` → `photo.webp`) | 1.5 MB | 46 KB (47,114 bytes) | −97% |
| Homepage `/[locale]` First Load JS | 208 kB | 164 kB | −44 kB (−21%) |
| First Load JS shared by all routes | 101 kB | 101 kB | unchanged |
| Fonts total (4 files) | 137 KB (.otf) | 65 KB (66,648 bytes, .woff2) | −53% |

Notes on the measurements:
- `photo.svg` no longer exists in `public/`; the hero now ships `public/photo.webp` at 47,114 bytes.
- The homepage route (`/[locale]`) First Load JS dropped from 208 kB to 164 kB, a direct result of removing `framer-motion` from the route bundle and converting animated sections to Server Components with CSS-driven reveals.
- The shared JS baseline (101 kB, framework/runtime chunks used by every route) is unchanged — `framer-motion` was part of the route-level bundle, not the shared chunk, so its removal only affected `/[locale]`'s own First Load JS.
- Fonts moved from 4 `.otf` files (137 KB) to 4 `.woff2` files (65 KB), a standard win from switching to a compressed web font format.

## What changed and why

- **Hero image extraction (Tasks 2–3):** Replaced the 1.5 MB inline `photo.svg` with a 46 KB `photo.webp`, served via `next/image` with `priority` so it participates in LCP preloading without needing a manual `<link rel="preload">`.
- **Framer Motion → CSS Reveal + Server Components (Tasks 4–13):** Removed the `framer-motion` dependency entirely (confirmed absent from `package.json` and from all `src` imports). Animation is now handled by CSS classes (see `globals.css` "Performance-optimized CSS animations" and "Scroll-triggered reveal" blocks) and a shared `Reveal` component (`as`/`delayMs`/`className` props), letting most sections revert to React Server Components instead of client components.
- **`ContactSection` split (Task 10):** Broken into smaller pieces to isolate the interactive/client-only parts from the server-renderable shell, per the oversized-file cleanup goal.
- **Fonts (Task 14):** Archiv Grotesk converted from `.otf` (137 KB total) to `.woff2` (65 KB total), cutting font payload by more than half.
- **Net effect:** homepage First Load JS is down 21% (208 kB → 164 kB) and the two heaviest static assets (hero image, fonts) are down 97% and 53% respectively, with no change to shared framework JS and no regression in lint/build cleanliness.

