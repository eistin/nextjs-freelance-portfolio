# Portfolio Performance & Clean-Code Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut homepage load time and improve code quality by eliminating the 1.4 MB hero image and removing Framer Motion from the render path via Server Components + a lightweight CSS reveal utility.

**Architecture:** Extract the raster embedded in `photo.svg` and serve it optimized through `next/image`. Replace Framer Motion entrance/scroll animations with CSS keyframes driven by a single `IntersectionObserver` wrapper (`<Reveal>`), converting presentational sections to Server Components and pushing interactivity (dialogs, clicks, forms) into small client leaves. Delete dead code, then uninstall `framer-motion`.

**Tech Stack:** Next.js 15 (App Router, standalone), React 19, Tailwind CSS 4, next-intl, next/image, sharp (build-time image extraction only).

**Spec:** `docs/superpowers/specs/2026-09-03-portfolio-performance-refactor-design.md`

## Global Constraints

- **Branch:** work on the existing `eistin/Portfolio-nextjs` branch. Do not open a new branch.
- **No test framework exists** in this repo. Per-task verification is: `npm run build` (must compile with no client/server boundary errors), `npm run lint` (must pass), targeted `grep` assertions, and a manual visual check on `/en` and `/fr`. Do not scaffold Jest/Vitest — it is out of scope.
- **Behavior-preserving** except the intentional, pre-approved animation simplifications (spring-physics hover → CSS transitions; `layoutId` pill → CSS; header scroll-interpolation → threshold toggle). Content, copy, i18n keys, routing, and the contact backend do not change.
- **i18n:** Server Components read translations via `getTranslations`/`getLocale` from `next-intl/server` and become `async`. Client leaves keep using `useTranslations`/`useLocale` (they run under `NextIntlClientProvider`). Never call a `use*` hook in a Server Component.
- **Commit after every task** with a conventional-commit message. End each commit message with:
  `Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL`
- **Do not pass functions/components across the server→client boundary** as props (not serializable). Client leaves import their own icons and map by string key.

---

## Shared Reference: Framer Motion → CSS/Reveal Cookbook

Every conversion task applies these exact mappings. `<Reveal>` is built in Task 3.

| Framer Motion pattern | Replacement |
|---|---|
| `const ref = useRef(null); const isInView = useInView(ref, { once: true, margin: "-100px" })` | Delete both. Wrap the animated subtree in `<Reveal>` (which encapsulates this observer). |
| `<motion.h2 initial={{opacity:0,y:20}} animate={isInView?{opacity:1,y:0}:...} transition={{duration:0.6}}>` | `<Reveal as="h2" className="...">` (renders `<h2>` that fades+rises in on view) |
| `<motion.div variants={containerVariants} initial="hidden" animate={isInView?"visible":"hidden"}>` + `itemVariants` stagger | Plain `<div>`; wrap each child in `<Reveal delayMs={index * 150}>` for the stagger |
| `<motion.div initial={{opacity:0,y:30}} animate={...} transition={{duration:0.6}}>` | `<Reveal>` (default fade-up) |
| `whileHover={{ scale: 1.05 }}` / `whileHover={{ scale: 1.02 }}` | Add Tailwind `transition-transform hover:scale-105` (or `hover:scale-[1.02]`) to the element; drop the motion wrapper |
| `whileHover={{ x: 5 }}` | Tailwind `transition-transform hover:translate-x-1` |
| `whileHover={{ y: -3 }}` | Tailwind `transition-transform hover:-translate-y-1` |
| `whileTap={{ scale: 0.98 }}` | Tailwind `active:scale-[0.98]` |
| accent line `initial={{height:"0%"}} whileHover/animate={{height:"100%"}}` | Tailwind `h-0 group-hover:h-full transition-[height] duration-500` (or `h-full` if it was tied to in-view) |
| `animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity }}` (pulse dot) | Tailwind `animate-pulse` |
| number "pop" `initial={{scale:0}} animate={isInView?{scale:1}:...}` | Wrap in `<Reveal delayMs={...}>`; drop the scale spring (fade is enough) |

After converting a file, it must contain **zero** `framer-motion` imports and zero `motion.`/`useInView`/`AnimatePresence` references. Verify with grep in the task's verification step.

---

## Task 1: Baseline measurement

Capture "before" numbers so the final report has real deltas.

**Files:**
- Create: `docs/superpowers/specs/2026-09-03-portfolio-performance-report.md` (baseline section only; completed in Task 15)

- [ ] **Step 1: Record the hero asset weight**

Run: `ls -la public/photo.svg && du -h public/photo.svg`
Record the byte size (expected ~1.4 MB).

- [ ] **Step 2: Run a production build and capture bundle sizes**

Run: `npm run build`
Copy the route table it prints (the `Route (app)` section with **First Load JS** per route, and the shared JS total). Save this output.

- [ ] **Step 3: Write the baseline into the report file**

Create `docs/superpowers/specs/2026-09-03-portfolio-performance-report.md` with a `## Baseline (before)` section containing: the `photo.svg` size, the homepage (`/[locale]`) First Load JS, and the shared JS total. Leave a `## Results (after)` heading empty for Task 15.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-09-03-portfolio-performance-report.md
git commit -m "docs: record performance baseline before refactor

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 2: Delete dead `StoriesSection`

`StoriesSection` is imported nowhere (verified). Removing it drops 17 Framer Motion usages and 3 stale `photo.svg` references before we touch the image.

**Files:**
- Delete: `src/components/sections/StoriesSection.tsx`

- [ ] **Step 1: Confirm it is unused**

Run: `grep -rn "StoriesSection" src`
Expected: only the file's own definition line(s) — no `import ... StoriesSection`. If any import exists, STOP and convert it instead (apply the Cookbook); do not delete.

- [ ] **Step 2: Delete the file**

Run: `git rm src/components/sections/StoriesSection.tsx`

- [ ] **Step 3: Verify build + lint still pass**

Run: `npm run build && npm run lint`
Expected: both succeed (nothing referenced it).

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: remove unused StoriesSection (dead code)

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 3: Extract and optimize the hero photo

Replace the 1.4 MB `photo.svg` (a raster base64-embedded in an SVG pattern) with a real optimized raster served through `next/image`.

**Files:**
- Create: `scripts/extract-photo.mjs`
- Create: `public/photo.webp` (generated)
- Delete: `public/photo.svg`
- Modify: `src/components/sections/HeroSection.tsx` (the `Image src`), `src/components/sections/AboutSection.tsx` (the `Image src`), `src/components/sections/ContactSection.tsx` (the `Image src`)
- Modify: `package.json` (adds `sharp` devDependency)

**Interfaces:**
- Produces: `/photo.webp` — the optimized hero/profile image consumed by Hero, About, and Contact.

- [ ] **Step 1: Add sharp (build-time only)**

Run: `npm install -D sharp`

- [ ] **Step 2: Write the extraction script**

Create `scripts/extract-photo.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/photo.svg", "utf8");
// The raster is embedded as a data URI in an xlink:href inside the <pattern>.
const match = svg.match(/xlink:href="data:image\/(png|jpe?g|webp);base64,([^"]+)"/);
if (!match) {
  console.error("No embedded base64 raster found in public/photo.svg");
  process.exit(1);
}
const buffer = Buffer.from(match[2], "base64");
const meta = await sharp(buffer).metadata();
console.log(`Embedded raster: ${meta.format} ${meta.width}x${meta.height}, ${buffer.length} bytes`);

// Display max is ~400px; export 800px (2x retina), square cover, as WebP.
await sharp(buffer)
  .resize(800, 800, { fit: "cover", position: "attention" })
  .webp({ quality: 80 })
  .toFile("public/photo.webp");

console.log("Wrote public/photo.webp");
```

- [ ] **Step 3: Run the script and verify the output**

Run: `node scripts/extract-photo.mjs && ls -la public/photo.webp`
Expected: prints the embedded dimensions and writes `public/photo.webp` at tens of KB (should be well under 100 KB). If it is still large, lower `quality` to 72 and re-run.

- [ ] **Step 4: Repoint all three `Image` usages**

In each file, change `src="/photo.svg"` to `src="/photo.webp"`:
- `src/components/sections/HeroSection.tsx` (the `width={192} height={192} priority` image)
- `src/components/sections/AboutSection.tsx` (the `width={400} height={400}` image)
- `src/components/sections/ContactSection.tsx` (the `width={128} height={128}` image)

Leave all other props (dimensions, `priority`, `fetchPriority`, classNames) unchanged.

- [ ] **Step 5: Delete the old SVG**

Run: `grep -rn "photo.svg" src` → expected: no matches. Then `git rm public/photo.svg`.

- [ ] **Step 6: Verify build, lint, and visual**

Run: `npm run build && npm run lint`
Then `npm run dev`, open `/en`, and confirm the profile photo renders in Hero, About (desktop ≥1024px), and Contact. The image should look identical.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "perf: replace 1.4MB embedded-raster photo.svg with optimized photo.webp

Extract the base64 raster from photo.svg, re-encode to an 800px WebP via
next/image, and repoint Hero/About/Contact. ~1.4MB -> tens of KB per load.

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 4: Add the `<Reveal>` component + CSS

A single reusable scroll-reveal wrapper that replaces every `useInView` + `motion` entrance animation.

**Files:**
- Create: `src/components/ui/Reveal.tsx`
- Modify: `src/app/globals.css` (add a reveal utility)

**Interfaces:**
- Produces: `Reveal` — `"use client"` component.
  ```ts
  type RevealProps = {
    children: React.ReactNode;
    as?: keyof React.JSX.IntrinsicElements; // default "div"
    delayMs?: number;                       // stagger offset, default 0
    className?: string;
  };
  ```
  Renders `as` element, hidden until it scrolls into view (once, `-100px` root margin), then plays a fade-up. Consumed by Tasks 5–9 and 11.

- [ ] **Step 1: Add the CSS utility**

Append to `src/app/globals.css` (the `fade-in-up` keyframes already exist from prior work — reuse them):

```css
/* Scroll-triggered reveal (replaces Framer Motion useInView entrances) */
.reveal {
  opacity: 0;
}
.reveal.reveal-visible {
  animation: fade-in-up 0.6s ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
  }
  .reveal.reveal-visible {
    animation: none;
  }
}
```

- [ ] **Step 2: Write the component**

Create `src/components/ui/Reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  delayMs?: number;
  className?: string;
};

export function Reveal({ children, as = "div", delayMs = 0, className }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "reveal-visible", className)}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: success (component is not yet used; this confirms it type-checks).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Reveal.tsx src/app/globals.css
git commit -m "feat: add Reveal scroll-animation wrapper to replace Framer Motion

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 5: Convert `RecentWorkSection` to a Server Component

Simplest section: entrance fades only, plus a `useParams` locale that we replace with a prop.

**Files:**
- Modify: `src/components/sections/RecentWorkSection.tsx`
- Modify: `src/app/[locale]/page.tsx` (pass `locale` prop)

**Interfaces:**
- Consumes: `Reveal` (Task 4), `Project[]` (existing `getAllProjects`).
- Produces: `RecentWorkSection` now takes `{ projects: Project[]; locale: string }`.

- [ ] **Step 1: Rewrite the section as server + Reveal**

In `src/components/sections/RecentWorkSection.tsx`:
- Remove `"use client"`, all `framer-motion` imports, `useParams`, `useRef`, the `containerVariants`/`itemVariants` objects.
- Add `import { getTranslations } from "next-intl/server"` and `import { Reveal } from "@/components/ui/Reveal"`.
- Change signature to `export default async function RecentWorkSection({ projects, locale }: RecentWorkSectionProps)` and update `RecentWorkSectionProps` to `{ projects: Project[]; locale: string }`.
- Replace `const t = useTranslations("recentWork")` with `const t = await getTranslations("recentWork")`. Delete the `useParams`/`locale` lines (locale now a prop).
- Per Cookbook: replace `<motion.h2 ...>` with `<Reveal as="h2" className="text-3xl font-bold text-center mb-8">`. Replace the outer `<motion.div variants=...>` grid with a plain `<div className="grid ...">`, and wrap each `displayProjects.map` item's top element in `<Reveal key={project.slug} delayMs={index * 150}>` (add `index` to the map callback). Replace the "See More" `<motion.div>` with `<Reveal className="text-center mt-8">`.

- [ ] **Step 2: Pass `locale` from the page**

In `src/app/[locale]/page.tsx`, change `<RecentWorkSection projects={projects} />` to `<RecentWorkSection projects={projects} locale={locale} />` (`locale` is already in scope).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/sections/RecentWorkSection.tsx` → expected: no matches.
Visual: `/en` projects grid fades in on scroll; project links still navigate.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/RecentWorkSection.tsx src/app/[locale]/page.tsx
git commit -m "refactor: convert RecentWorkSection to a Server Component

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 6: Convert `ServicesSection` to server + extract `ServiceCard` client leaf

The card click uses `useService` (client). Extract the card; keep the section on the server.

**Files:**
- Create: `src/components/sections/ServiceCard.tsx`
- Modify: `src/components/sections/ServicesSection.tsx`

**Interfaces:**
- Consumes: `useService` (existing context), `Reveal` (Task 4).
- Produces: `ServiceCard` — `"use client"`, props `{ serviceKey: "infrastructure" | "cicd" | "kubernetes" | "cloud"; id: string; title: string; description: string; className?: string }`. Imports its own lucide icon and maps by `serviceKey`.

- [ ] **Step 1: Create the client card**

Create `src/components/sections/ServiceCard.tsx`:

```tsx
"use client";

import { ChevronRight, Code2, Rocket, Container, Cloud, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useService } from "@/contexts/ServiceContext";

type ServiceKey = "infrastructure" | "cicd" | "kubernetes" | "cloud";

const ICONS: Record<ServiceKey, LucideIcon> = {
  infrastructure: Code2,
  cicd: Rocket,
  kubernetes: Container,
  cloud: Cloud,
};

type ServiceCardProps = {
  serviceKey: ServiceKey;
  id: string;
  title: string;
  description: string;
  className?: string;
};

export function ServiceCard({ serviceKey, id, title, description, className }: ServiceCardProps) {
  const { selectServiceAndScroll } = useService();
  const Icon = ICONS[serviceKey];

  return (
    <div className={className}>
      <Card
        className="group h-full hover:shadow-lg transition-all duration-500 cursor-pointer overflow-hidden relative bg-card border border-border hover:border-primary/50"
        onClick={() => selectServiceAndScroll(serviceKey)}
      >
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all group-hover:scale-105">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-primary">{id}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
              <ChevronRight className="text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <CardTitle className="text-2xl mb-4 group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
          <div className="absolute left-0 top-0 w-1 h-0 group-hover:h-full bg-primary rounded-r-full transition-[height] duration-500 ease-out" />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the section as server**

In `src/components/sections/ServicesSection.tsx`:
- Remove `"use client"`, `framer-motion`, `useRef`, `useService`, `useInView`, the variants objects, and the lucide `Card*`/icon imports now living in `ServiceCard`.
- Add `import { getTranslations } from "next-intl/server"`, `import { Reveal } from "@/components/ui/Reveal"`, `import { ServiceCard } from "./ServiceCard"`.
- Make it `export default async function ServicesSection()`; `const t = await getTranslations("services")`.
- Keep the `services` array but drop the `icon` field (icons live in `ServiceCard`); keep `id`, `key`, `width`.
- Render `<Reveal as="h2" className="text-4xl font-bold text-center mb-16">{t("title")}</Reveal>`, then a plain `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">` mapping each service to:
  ```tsx
  <Reveal key={service.id} delayMs={index * 200}>
    <ServiceCard
      serviceKey={service.key as "infrastructure" | "cicd" | "kubernetes" | "cloud"}
      id={service.id}
      title={t(`items.${service.key}.title`)}
      description={t(`items.${service.key}.description`)}
      className={service.width}
    />
  </Reveal>
  ```
  (add `index` to the `.map` callback).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/sections/ServicesSection.tsx` → no matches.
Visual: `/en` service cards fade in staggered; clicking a card scrolls to Contact and pre-fills the subject (the `useService` flow still works).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/ServicesSection.tsx src/components/sections/ServiceCard.tsx
git commit -m "refactor: convert ServicesSection to server + ServiceCard client leaf

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 7: Convert `AboutSection` to a Server Component

Pure presentational — image + stats with entrance/hover animation.

**Files:**
- Modify: `src/components/sections/AboutSection.tsx`

- [ ] **Step 1: Rewrite as server + Reveal**

In `src/components/sections/AboutSection.tsx`:
- Remove `"use client"`, `framer-motion`, `useRef`, `useInView`, the variants objects.
- Add `import { getTranslations } from "next-intl/server"` and `import { Reveal } from "@/components/ui/Reveal"`.
- Make it `export default async function AboutSection()`; `const t = await getTranslations("about")`.
- Per Cookbook: `<motion.h2>` → `<Reveal as="h2" ...>`. The left image `<motion.div ...>` → `<Reveal className="hidden lg:block lg:col-span-2 relative">`; the inner image `whileHover` wrapper → a plain `<div className="relative aspect-square max-w-sm mx-auto lg:mx-0 transition-transform hover:scale-[1.02]">`; drop the hover-overlay `motion.div` (or keep as a static `group-hover:opacity-100` overlay). The right content column `<motion.div variants=...>` → plain `<div>`, wrap the description block and each stat card in `<Reveal delayMs={index * 150}>` (add `index` to the stats `.map`). For each stat: replace the icon `whileHover` motion with Tailwind `transition-transform group-hover:scale-105`; replace the number `<motion.h3>` pop with a plain `<h3>` (fade comes from the enclosing `Reveal`); replace the accent-line `motion.div` with `<div className="absolute left-0 top-0 w-1 h-full bg-primary rounded-r-full" />`; replace the hover `ArrowUpRight` `motion.div` with `<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">`.
- The `stats` array uses `t(...)` — fine with `await getTranslations`.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/sections/AboutSection.tsx` → no matches.
Visual: `/en` About section — heading, image (desktop), and stat cards fade in; hover still lifts/scales.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AboutSection.tsx
git commit -m "refactor: convert AboutSection to a Server Component

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 8: Convert `TestimonialsSection` to server + extract `TestimonialCard` client leaf

Only the Radix `Dialog` needs the client. The carousel is already pure CSS.

**Files:**
- Create: `src/components/sections/TestimonialCard.tsx`
- Modify: `src/components/sections/TestimonialsSection.tsx`

**Interfaces:**
- Consumes: `Testimonial` type (existing), Radix `Dialog`, `Reveal`.
- Produces: `TestimonialCard` — `"use client"`, props `{ testimonial: Testimonial; variant: "desktop" | "mobile" }`. Owns the card + its `Dialog` modal.

- [ ] **Step 1: Create the client card**

Create `src/components/sections/TestimonialCard.tsx` containing the `<Dialog>…</Dialog>` block currently rendered per testimonial (both the trigger `Card` and the `DialogContent`). Accept `variant` to pick the card sizing classes: desktop uses `w-80 h-64` + `p-5` + `line-clamp-4`; mobile uses `w-64 sm:w-72 h-60` + `p-4` + `line-clamp-3`. Imports: `Card, CardContent`, `Avatar, AvatarFallback, AvatarImage`, `Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger`, `Star`, and `type Testimonial`. No `framer-motion`.

- [ ] **Step 2: Rewrite the section as server**

In `src/components/sections/TestimonialsSection.tsx`:
- Remove `"use client"`, `framer-motion`, `useRef`, `useInView`, and the now-unused `Card`/`Avatar`/`Dialog`/`Star` imports (they live in `TestimonialCard`).
- Add `import { getTranslations } from "next-intl/server"`, `import { Reveal } from "@/components/ui/Reveal"`, `import { TestimonialCard } from "./TestimonialCard"`.
- Make it `export default async function TestimonialsSection({ testimonials }: TestimonialsSectionProps)`; `const t = await getTranslations("testimonials")`.
- `<motion.h2>` → `<Reveal as="h2" className="text-3xl font-bold text-center mb-8">`.
- Keep both carousel `<div>`s (desktop `hidden lg:block`, mobile `lg:hidden`) with their existing CSS `animation` styles. Replace each `[...testimonials, ...testimonials].map(...)` body with `<TestimonialCard key={...} testimonial={testimonial} variant="desktop" />` (and `"mobile"` for the second carousel).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/sections/TestimonialsSection.tsx` → no matches.
Visual: `/en` testimonials scroll continuously; clicking a card opens the dialog with the full quote.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/TestimonialsSection.tsx src/components/sections/TestimonialCard.tsx
git commit -m "refactor: convert TestimonialsSection to server + TestimonialCard client leaf

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 9: Convert `HeroSection` to a Server Component

Hero already uses CSS for most animations; only the logo-carousel fade and the CTA `onClick` remain.

**Files:**
- Modify: `src/components/sections/HeroSection.tsx`

- [ ] **Step 1: Rewrite as server**

In `src/components/sections/HeroSection.tsx`:
- Remove `"use client"` and the `framer-motion` import.
- Add `import { getTranslations } from "next-intl/server"`. Make it `export default async function HeroSection()`; `const t = await getTranslations("hero")` and `const tLogos = await getTranslations("companyLogos")`.
- Replace the CTA `<Button onClick={() => document.getElementById('contact')?.scrollIntoView(...)}>` with an anchor button: `<Button asChild size="lg" className="px-8"><a href="#contact">{t("cta")}</a></Button>` (native anchor scroll; `globals.css`/browser handles smooth scroll if `scroll-behavior: smooth` is set — if it is not, this is an approved minor change from animated to instant scroll).
- Replace the logo-carousel `<motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}}>` with a plain `<div className="mt-12 lg:mt-20 relative animate-fade-in-up" style={{ animationDelay: "0.8s" }}>` (reuses the existing `fade-in-up` utility). The inner CSS `animation: scroll ...` carousel is unchanged.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/sections/HeroSection.tsx` → no matches.
Visual: `/en` hero renders; photo, heading, and CTA animate in; logo carousel scrolls; the CTA scrolls to Contact.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/HeroSection.tsx
git commit -m "refactor: convert HeroSection to a Server Component

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 10: Split and de-Framer `ContactSection`

439 lines with form + info + heavy Framer decoration. Split into a server wrapper + two client leaves; drop Framer Motion.

**Files:**
- Create: `src/components/sections/ContactInfo.tsx`
- Create: `src/components/sections/ContactForm.tsx`
- Modify: `src/components/sections/ContactSection.tsx`

**Interfaces:**
- Produces:
  - `ContactSection` — `async` Server Component: heading + 2-col grid wrapper rendering `<ContactInfo />` and `<ContactForm />`.
  - `ContactInfo` — `"use client"` (uses `useAnalytics` click tracking): profile photo, contact links, social links.
  - `ContactForm` — `"use client"`: the `<form>`, `useService`, `useState`/`useTransition`, `submitContactForm`, analytics.

- [ ] **Step 1: Create `ContactForm` (client)**

Create `src/components/sections/ContactForm.tsx` with the form half of the current file: the `useTranslations("contact")` + `useTranslations("services")`, `useLocale`, `useService` (`selectedService`, `setSelectedService`), `useState`(subject/result/errors), `useTransition`, the `useEffect` that sets the subject, `handleSubmit`, `clearSelectedService`, and the entire right-column `Card`/`form` JSX (selected-service indicator + fields + submit + result message). Remove all `framer-motion`: the field `motion.div whileHover={{scale:1.02}}` wrappers become plain `<div>` with Tailwind `transition-transform hover:scale-[1.01]` where desired; the submit `motion.div` becomes a plain `<div className="pt-4">`; the result/indicator entrance `motion.div`s become plain `<div>`. No `useInView`.

- [ ] **Step 2: Create `ContactInfo` (client)**

Create `src/components/sections/ContactInfo.tsx` with the left-column content: profile photo (`/photo.webp`, from Task 3), `t("ready")`/`t("heading")`/`t("description")`, the `contactInfo` links, and the `socialLinks` with `useAnalytics` `trackButtonClick` on click. Remove all `framer-motion`: the profile `whileHover` wrapper → `transition-transform hover:scale-105`; the pulse dot `motion.div animate={{scale:[1,1.2,1]}}` → `<div className="... animate-pulse" />`; contact-link `motion.a whileHover={{x:5}}` → `<a className="... transition-transform hover:translate-x-1">`; social `motion.div whileHover={{y:-3}}` → `<div className="transition-transform hover:-translate-y-1">`. Keep `useTranslations("contact")`.

- [ ] **Step 3: Rewrite `ContactSection` as a thin server wrapper**

Replace `src/components/sections/ContactSection.tsx` with:

```tsx
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { ContactInfo } from "./ContactInfo";
import { ContactForm } from "./ContactForm";

export default async function ContactSection() {
  const t = await getTranslations("contact");
  return (
    <section className="container mx-auto">
      <Reveal as="h2" className="text-4xl font-bold text-center mb-16">
        {t("title")}
      </Reveal>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ContactInfo />
        <ContactForm />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run lint`
Then `grep -rn "framer-motion\|motion\.\|useInView" src/components/sections/Contact*.tsx` → no matches.
Visual: `/en` and `/fr` Contact — info + form render; selecting a service from Services still fills the form's subject and shows the badge; submitting the form still works (success/error message shows).

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/ContactSection.tsx src/components/sections/ContactInfo.tsx src/components/sections/ContactForm.tsx
git commit -m "refactor: split ContactSection into server wrapper + info/form client leaves

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 11: De-Framer the navigation (`Header` + `LanguageSwitcher`)

Both stay client (menu state / interactivity) but must drop `framer-motion` so it leaves the shared bundle. Approved minor visual simplifications apply.

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Replace Header scroll-interpolation with a threshold toggle**

In `src/components/Header.tsx`, read the file first. Remove `import { motion, useScroll, useTransform } from "framer-motion"` and the `useScroll`/`useTransform` values (`headerBackground`, `headerShadow`, `headerBorderRadius`, `headerPadding`). Add a scroll listener:

```tsx
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 100);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

Convert the animated header `motion.*` wrapper to a plain element whose classes switch on `scrolled`, e.g. `className={cn("transition-all duration-300", scrolled ? "bg-background/80 shadow-lg rounded-3xl p-2" : "bg-transparent")}` (match the original start/end visual values from the `useTransform` ranges). Replace any remaining `motion.*` (nav item hovers, etc.) per the Cookbook.

- [ ] **Step 2: Replace `LanguageSwitcher` `layoutId` with CSS**

In `src/components/LanguageSwitcher.tsx`, remove `import { motion } from "framer-motion"`. Replace the `<motion.div layoutId="activeLanguage" />` active-pill with a plain `<div>` highlight positioned by the active state (a `bg-primary/10 rounded` behind the active option), using `transition-colors`. Replace any other `motion.*` per the Cookbook.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\." src/components/Header.tsx src/components/LanguageSwitcher.tsx` → no matches.
Visual: header still restyles on scroll (background/shadow/rounding appear past ~100px); language switch still works and highlights the active locale; mobile menu still opens.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/components/LanguageSwitcher.tsx
git commit -m "refactor: remove Framer Motion from Header and LanguageSwitcher

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 12: De-Framer the sub-route components (`RecentWorkPage` + `ProjectDetailView`)

Not on the homepage, but required to fully uninstall `framer-motion`. Both use only simple entrance animations.

**Files:**
- Modify: `src/components/pages/RecentWorkPage.tsx`
- Modify: `src/components/project/ProjectDetailView.tsx`

- [ ] **Step 1: Convert `RecentWorkPage`**

Read the file. It uses `framer-motion` + `useInView` for entrance fades. It can stay `"use client"` (it may use `useParams`/interactivity) — the goal is only removing `framer-motion`. Remove the `framer-motion`/`useInView` imports and apply the Cookbook: `motion.*` entrances → `<Reveal>` (import from `@/components/ui/Reveal`), hovers → Tailwind. Delete unused variant objects.

- [ ] **Step 2: Convert `ProjectDetailView`**

Read the file. It imports `framer-motion` but has no `motion.` usages (likely an unused or near-unused import). Remove the `framer-motion` import; if any stray `motion.*`/`useInView` exists, apply the Cookbook.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Then `grep -n "framer-motion\|motion\.\|useInView" src/components/pages/RecentWorkPage.tsx src/components/project/ProjectDetailView.tsx` → no matches.
Visual: `/en/recent-work` list and a `/en/projects/<slug>` detail page render and animate in.

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/RecentWorkPage.tsx src/components/project/ProjectDetailView.tsx
git commit -m "refactor: remove Framer Motion from recent-work and project-detail views

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 13: Uninstall `framer-motion`

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Confirm zero usages remain**

Run: `grep -rn "framer-motion" src`
Expected: **no matches**. If any remain, STOP and convert them (Cookbook) before uninstalling.

- [ ] **Step 2: Uninstall**

Run: `npm uninstall framer-motion`

- [ ] **Step 3: Verify the bundle**

Run: `npm run build`
Expected: success. Note the homepage First Load JS — it should have dropped materially versus the Task 1 baseline.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "perf: remove framer-motion dependency (no longer used)

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 14: Convert fonts to WOFF2

`.otf` is heavier than `.woff2`. Convert the 4 Archiv Grotesk weights and update `localFont`.

**Files:**
- Create: `src/app/[locale]/fonts/*.woff2` (4 files)
- Modify: `src/app/[locale]/layout.tsx` (font `src` paths)
- Delete: the 4 converted `.otf` files (keep any weight not referenced by `layout.tsx` only if still needed elsewhere — check first)

- [ ] **Step 1: Convert the four referenced weights to WOFF2**

The referenced weights are `ArchivGrotesk-Regular2`, `-Normal2`, `-SemiBold2`, `-Bold2`. Convert each `.otf` → `.woff2`. Preferred tool: `fonttools` (`pip install fonttools brotli`, then `python -c "from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); f.flavor='woff2'; f.save(sys.argv[2])" in.otf out.woff2`). If `fonttools` is unavailable, STOP and report — do not ship without the conversion. Write outputs alongside the `.otf` files in `src/app/[locale]/fonts/`.

- [ ] **Step 2: Update `layout.tsx` font paths**

In `src/app/[locale]/layout.tsx`, change each `localFont` `src` `path` from `./fonts/ArchivGrotesk-<Weight>2.otf` to `.woff2`. Keep `variable`, `display: "swap"`, `preload: true`, `fallback` unchanged.

- [ ] **Step 3: Remove the now-unused `.otf` files**

Run: `grep -rn "ArchivGrotesk-.*\.otf" src` → expected: no matches. Then `git rm` the four converted `.otf` files. (`-Light2.otf` and `-Hairline2.otf` are not referenced by `layout.tsx`; leave them unless grep shows they too are unused — if unused, remove them as well.)

- [ ] **Step 4: Verify**

Run: `npm run build && npm run lint`
Visual: `/en` renders in Archiv Grotesk (headings/body use the custom font, not the system fallback).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: convert Archiv Grotesk fonts from OTF to WOFF2

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Task 15: Final measurement + written report

**Files:**
- Modify: `docs/superpowers/specs/2026-09-03-portfolio-performance-report.md`

- [ ] **Step 1: Capture after-metrics**

Run: `npm run build`
Record the homepage First Load JS and shared JS total. Run `ls -la public/photo.webp` for the new hero asset size.

- [ ] **Step 2: Write the results section**

Fill in `## Results (after)` in the report: before/after table for (a) hero image bytes, (b) homepage First Load JS, (c) shared JS; note `framer-motion` removed and fonts converted. Add a short "What changed and why" summary referencing the tasks.

- [ ] **Step 3: Final full verification**

Run: `npm run build && npm run lint`
Then `grep -rn "framer-motion\|photo.svg" src public` → expected: no matches.
Manual pass on `/en` and `/fr`: hero, services (click→contact), recent work (links), testimonials (dialog), about, contact (submit), header (scroll restyle), language switch.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-09-03-portfolio-performance-report.md
git commit -m "docs: record performance results after refactor

Claude-Session: https://claude.ai/code/session_01JfTWKXhcowmCqb322mcUmL"
```

---

## Self-Review Notes

- **Spec coverage:** Area 1 (image) → Tasks 2–3; Area 2 (preload) → handled by `next/image priority` after Task 3, verified in Task 15; Area 3 (Framer removal / Server Components) → Tasks 4–13; Area 4 (split oversized files) → Task 10 (ContactSection); `StoriesSection`/blog-detail splits reduced to the higher-value `StoriesSection` deletion (Task 2) since blog detail was not on the slow path — noted here as an intentional scope trim; Area 5 (fonts) → Task 14; Area 6 (measure) → Tasks 1 & 15; Area 7 (report) → Task 15.
- **Types:** `ServiceKey` union is consistent across `ServiceCard` and `ServicesSection`; `RecentWorkSectionProps` gains `locale: string` and the page passes it; `Reveal` prop names (`as`, `delayMs`, `className`) are used consistently in Tasks 5–11.
- **Preload note:** the `logo.svg` Header preload in `layout.tsx` is left as-is (it is the above-the-fold logo); revisit only if Task 15 measurement shows it is not the LCP.
