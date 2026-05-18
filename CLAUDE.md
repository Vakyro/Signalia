# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Signalia** is a Mexican Sign Language (Lengua de Señas Mexicana / LSM) learning and translation platform. It is a **frontend-only** Next.js app with no backend, database, or real API integration — all sign data is mocked.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build (TypeScript errors are ignored via next.config.mjs)
npm run start     # Serve production build
npm run lint      # Run ESLint
```

No test suite exists. There is no single-test command.

## Architecture

### Routing (Next.js App Router)
- `/` → redirects to `/traducir`
- `/traducir` — Sign-to-text: video recording/upload with mock AI processing states
- `/texto-a-sena` — Text-to-sign: maps typed words to sign cards via `lib/sign-data.ts`
- `/aprender` — Learn signs by category (alfabeto, números, palabras, acciones)
- `/contribuir` — Community contribution landing page

### Layout System
All pages are wrapped by `components/layout/app-layout.tsx` which composes:
- `sidebar.tsx` — desktop hover-to-expand sidebar
- `bottom-nav.tsx` — mobile-only fixed bottom nav
- `header.tsx` — sticky header with page title

Theme (dark/light) is toggled in both sidebar and header; preference is stored in `localStorage`.

### Data Layer
`lib/sign-data.ts` is the single source of truth for all sign language content. It exports typed category lists, descriptions, emojis, and helper functions (`getSignDescription`, `getSignEmoji`, `getCategoryBySign`). The `Category` type is `'alfabeto' | 'numeros' | 'palabras' | 'acciones'`.

### State Management
No global state library. Each page component manages its own state with `useState`. Toast notifications use a context in `components/toast-provider.tsx` (accessed via `hooks/use-toast.ts`). Mobile breakpoint detection uses `hooks/use-mobile.ts` (768px threshold).

### UI Components
`components/ui/` contains ~63 shadcn/ui components (new-york style, RSC-compatible). Import with `@/components/ui/<name>`. The `cn()` utility from `lib/utils.ts` merges Tailwind classes.

### Styling
Tailwind CSS 4.2 with `@tailwindcss/postcss`. Custom CSS variables use `oklch()` color format defined in `app/globals.css` (palette-1 through palette-7 plus semantic tokens). `tw-animate-css` provides animation utilities.

### Key Config Notes
- `next.config.mjs` sets `ignoreBuildErrors: true` and `images.unoptimized: true`
- `tsconfig.json` has strict mode on; path alias `@/*` maps to the root
- `components.json` configures shadcn/ui with base color `neutral` and `rsc: true`
