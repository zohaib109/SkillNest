# AGENTS.md

This file provides guidance to AI coding assistants working in this repository.

---

## Project Overview

**SkillNest** is a transactional tutoring marketplace (Preply-inspired) where global students book paid 1-on-1 virtual lessons with verified tutors (Pakistan-first tutor launch).

Detailed repository knowledge is organized in the `docs/` system:
- **`docs/project-context.md`**: Product vision, MVP scope, current state, user roles, roadmap.
- **`docs/architecture.md`**: Technical stack, folder structure, routing, auth flow, database models.
- **`docs/decisions.md`**: Architectural & business decisions log and development constraints.

---

## Commands

| Task | Command |
| :--- | :--- |
| **Install dependencies** | `pnpm install` |
| **Dev server** | `pnpm dev` (http://localhost:3000) |
| **Production build** | `pnpm build` *(Note: Avoid running build during MVP dev unless requested)* |
| **Start production** | `pnpm start` |
| **Lint & check** | `pnpm lint` (Biome check) |
| **Lint & fix** | `pnpm lint:fix` (Biome auto-fix) |
| **Format code** | `pnpm format` (Biome format write) |

---

## Package Manager

**pnpm only.** Do not use `npm` or `yarn`. Workspace config is in `pnpm-workspace.yaml`.

---

## Essential Rules & Guidelines

1. **Context First**: Inspect existing code and check `docs/` before making architectural or structural changes.
2. **Locked Technology Stack**:
   - Next.js 16.2.10 (App Router, Server Components preferred)
   - React 19.2.4
   - TypeScript 5.9.x (Do not upgrade to TS 7 for v1)
   - Tailwind CSS v4 (`@tailwindcss/postcss`) with CSS-first custom properties
   - MongoDB Atlas + Mongoose 9.7.4 (Application domain models)
   - Better Auth 1.6+ with native MongoDB adapter
3. **Database & Auth Separation**:
   - Better Auth manages `user` and `session` collections directly via native MongoDB driver.
   - **CRITICAL**: Do **NOT** wrap `user` or `session` collections in Mongoose models.
   - Application domain models (`TutorProfile`, `Booking`, etc.) are defined in `models/` using Mongoose and reference `userId` as a string matching `user.id`.
4. **Next.js 16 Proxy Convention**:
   - Use `proxy.ts` at project root (replaces `middleware.ts`).
   - Session cookie checks must use **underscores**: `better-auth.session_token` and `__Secure-better-auth.session_token`.
5. **Theme & Hydration**:
   - The site uses a hydration-safe theme initializer (`head` inline script in `app/layout.tsx` with `suppressHydrationWarning` on `<html>`).
   - Card backgrounds in Tailwind map to `--color-white: var(--theme-white)` in `app/globals.css`.
6. **Data Conventions**:
   - Datetimes must be stored in **UTC** in MongoDB and formatted to the user's local timezone in the UI.
   - Tutor intro videos use external YouTube/Vimeo links only.
   - Unauthenticated users cannot search tutors or view tutor profiles.
7. **Verification**:
   - Run `pnpm lint` after making changes to verify Biome checks pass cleanly.
8. **Dev Server**:
   - `pnpm dev` uses the default Turbopack compiler (webpack was removed for being too slow). Do not add `--webpack` back to `package.json`.
