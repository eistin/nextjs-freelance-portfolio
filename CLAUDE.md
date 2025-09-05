# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Production build**: `npm run build`
- **Start production server**: `npm start`
- **Linting**: `npm run lint`

## Project Architecture

This is a Next.js 15 freelance portfolio website with internationalization support, built using the App Router pattern and TypeScript.

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Internationalization**: next-intl with French (default) and English locales
- **UI Components**: Radix UI primitives with shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Custom Archiv Grotesk font family

### Project Structure
```
src/
├── app/[locale]/           # Internationalized routes
│   ├── fonts/             # Custom font files (Archiv Grotesk)
│   ├── layout.tsx         # Root layout with i18n setup
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── sections/          # Page sections (Hero, About, Services, etc.)
│   └── Header.tsx         # Main navigation
├── i18n/
│   ├── routing.ts         # Locale routing configuration
│   ├── navigation.ts      # i18n navigation utilities
│   └── request.ts         # Server-side i18n setup
├── lib/
│   ├── utils.ts           # Utility functions (cn helper)
│   ├── projects.ts        # Project data management
│   └── testimonials.ts    # Testimonials data management
└── middleware.ts          # i18n middleware for route handling
```

### Internationalization Setup
- **Default locale**: French (`fr`)
- **Supported locales**: French (`fr`) and English (`en`)
- **Translation files**: Located in `messages/` directory (en.json, fr.json)
- **Route structure**: `/[locale]/` with automatic locale detection
- **Middleware**: Handles locale routing and redirects

### UI Component System
- **Design system**: shadcn/ui with "new-york" style preset
- **Base color**: Neutral
- **CSS variables**: Enabled for theming
- **Component aliases**: Configured in `components.json`
  - `@/components` for components
  - `@/components/ui` for UI primitives
  - `@/lib/utils` for utilities

### Content Structure
The portfolio includes these main sections:
- Hero section with DevOps/SRE branding
- Services (Infrastructure as Code, CI/CD, Kubernetes, Cloud Architecture)
- Recent work showcase
- Testimonials
- Stories/Blog section
- About section with statistics
- Contact form
- Company logos display

### Content Management
- **Projects**: Markdown files in `content/projects/[locale]/` with gray-matter frontmatter
- **Testimonials**: Markdown files in `content/testimonials/[locale]/` with gray-matter frontmatter
- **Content assets**: Located in `content/` directory
- **Images**: Project images in `public/projects/`, company logos in `public/logo_companies/`

### Font Configuration
Custom Archiv Grotesk font with multiple weights (100-700) loaded via `next/font/local` and applied through CSS variables.

### Development Notes
- Uses TypeScript with strict mode enabled
- Path mapping configured for `@/*` imports
- ESLint configured with Next.js preset
- PostCSS configured for Tailwind CSS processing
- All components follow React Server Components pattern where applicable
- Standalone output configuration for containerized deployment