# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

Tutoring marketplace called **SkillNest** (Preply-inspired) — a transactional platform where students book paid single lessons with tutors. Pakistan-first tutor launch, global students. See `.trae/documents/tutoring_marketplace_plan.md` for the full product spec and 10-phase roadmap.

## Commands

| Task | Command |
|---|---|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (http://localhost:3000) |
| Production build | `pnpm build` |
| Start production | `pnpm start` |
| Lint | `pnpm lint` (ESLint via `eslint-config-next`) |

No test runner is configured yet.

## Package Manager

**pnpm only.** Do not use npm or yarn. The workspace config is in `pnpm-workspace.yaml`.

## Stack (Locked)

- **Next.js 16.2.10** with App Router
- **React 19.2.4**
- **TypeScript 5.x** (not TS 7 — Next.js 16 still requires experimental path for TS 7)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **MongoDB Atlas** for the database cluster (all collections in one cluster)
- **Mongoose** for app schemas (TutorProfile, Booking, Payment, Review, Payout)
- **Better Auth v1.6+** with MongoDB adapter — manages its own `users` and `sessions` collections via the native MongoDB driver. **Do NOT wrap auth collections in Mongoose models.**
- **Zod** for API input validation
- **Biome** for lint/format (planned — currently using ESLint)

## Architecture (Planned)

The app follows a standard Next.js App Router structure. Key organizational decisions:

- **Route groups**: `app/(auth)/` for sign-in/sign-up, `app/dashboard/` for role-based dashboards (student, tutor, admin)
- **API routes**: `app/api/auth/`, `app/api/bookings/`, `app/api/payments/`, `app/api/tutors/`, `app/api/agora/`
- **Server-first**: prefer Server Components; client state should be local and intentional
- **Shared libs**: `lib/` for db connection, env validation, slug generation, timezone/currency helpers, payment and agora abstractions
- **Models**: `models/` for Mongoose schemas (TutorProfile, Booking, Payment, Review, Payout). Auth collections (`users`, `sessions`) are managed by Better Auth via native MongoDB driver — no Mongoose models for these.
- **Validation**: `lib/validators/` for Zod schemas used in API route input validation
- **Server actions**: `actions/` grouped by domain (auth, tutors, bookings, reviews, admin)
- **Components**: `components/` grouped by feature area (layout, marketing, tutors, forms, dashboard, shared)
- **Path alias**: `@/*` maps to project root (`tsconfig.json` paths)

## Design Direction

**Warm editorial minimal** — the reference design establishes these concrete patterns:

- **Background**: light cream/beige (`#FAF8F5` range) for main surfaces, white for nav and cards
- **Primary accent**: warm brown (buttons, borders, active states) — used for filled CTAs ("Log In") and outlined buttons ("Sign Up" border + text)
- **Typography**: bold sans-serif for headlines (heavy weight, large size), regular sans-serif for body copy in gray. Strong hierarchy through size and weight, not color variety
- **Layout**: generous whitespace, two-column hero layouts (text left, imagery right), centered nav links
- **Components**: rounded rectangles with subtle shadows for search/input fields, rounded pill buttons, circular avatar thumbnails
- **Trust indicators**: gold star ratings, student count badges, overlapping circular profile photos
- **Photography**: warm lifestyle images with natural lighting, not stock-photo-flat or illustration-heavy
- **Fonts**: `Bricolage Grotesque` ExtraBold 800 for all headings/display text; `Plus Jakarta Sans` Regular 400 + Medium 500 for body copy and UI. Both imported via `next/font/google`.
- **Animations**: short, useful, never decorative at the cost of speed

## Conventions

- Store all times in **UTC**; display in user's local timezone in the UI
- Tutor intro videos use **YouTube/Vimeo links**, not direct uploads
- Launch scope is **English only** — no i18n routing or translation infrastructure in v1
- Tutor profiles require **admin approval** before appearing in search
- Payouts are **manual** in v1 (no Stripe Connect needed)
- Refunds are **admin-reviewed**, not automated
- Lesson durations are **tutor-selected fixed options**, not freeform input

## Development Guidelines

- **Inspect Existing State**: Before writing or modifying code, inspect existing project files, `package.json`, and any current authentication/configuration files.
- **Documentation First**: Use only the official documentation matching the exact installed versions of libraries and frameworks. Do not rely on memory or older library behaviors. If memory conflicts with official docs, follow the official docs.
- **Next.js Conventions**: If a file convention changed in the current Next.js version, use the current official convention. For Next.js 16, use `proxy.ts` instead of `middleware.ts` unless the official documentation clearly requires Next.js Middleware for a specific Edge-runtime case.
- **Better Auth Validation**: Confirm Better Auth API usage, config, and functions from official documentation before writing or editing auth-related code.
- **No Assumptions**: If anything is unclear, stop and report the uncertainty immediately instead of inventing or assuming an implementation.

## Current State

Phase 1 (Foundation) is **partially complete** — the `create-next-app` scaffold exists at repo root with Next.js 16, React 19, Tailwind v4, and TypeScript 5. Still missing: shadcn/ui, Biome, MongoDB/Better Auth connection, env management, design tokens matching the warm cream/brown palette, and the editorial homepage layout. Pages are still the default boilerplate. Project root is `Tutoring-marketplace/` (no subfolders).

