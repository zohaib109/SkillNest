# AGENTS.md

This file provides guidance to AI coding assistants working in this repository.

---

## Project Overview

**SkillNest** is a transactional tutoring marketplace (Preply-inspired) where global students book paid 1-on-1 virtual lessons with verified tutors (Pakistan-first tutor launch).

Detailed repository knowledge is organized in the `docs/` system:
- **`docs/project-context.md`**: Product vision, MVP scope, current state, user roles, roadmap.
- **`docs/architecture.md`**: Technical stack, folder structure, routing, auth flow, database models.
- **`docs/decisions.md`**: Architectural & business decisions log and development constraints.
- **`docs/roadmap.md`**: Authoritative milestone order, current focus, and acceptance criteria.

---

## Commands

| Task | Command |
| :--- | :--- |
| **Install dependencies** | `pnpm install --frozen-lockfile` |
| **Dev server** | `pnpm dev` (http://localhost:3000) |
| **Production build** | `pnpm build` |
| **Start production** | `pnpm start` |
| **Lint & check** | `pnpm lint` (Biome check) |
| **Lint & fix** | `pnpm lint:fix` (Biome auto-fix) |
| **Format code** | `pnpm format` (Biome format write) |
| **Type check** | `pnpm typecheck` |
| **Unit tests** | `pnpm test` (Vitest run) |
| **Database smoke** | `pnpm test:smoke` with an isolated `SMOKE_MONGODB_URI` |

---

## Package Manager

**pnpm only.** Do not use `npm` or `yarn`. Workspace config is in `pnpm-workspace.yaml`.

---

## Essential Rules & Guidelines

1. **Context First**: Inspect existing code and check `docs/` before making architectural or structural changes.
2. **Locked Technology Stack**:
   - Next.js 16.4.6 (App Router, Server Components preferred)
   - React 19.2.4
   - TypeScript 5.9.x (Do not upgrade to TS 7 for v1)
   - Tailwind CSS v4 (`@tailwindcss/postcss`) with CSS-first custom properties
   - MongoDB Atlas + Mongoose 9.11.4 (Application domain models)
   - Better Auth 1.7.7 with native MongoDB adapter
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
8. **Development Compiler**:
   - Keep `pnpm dev` on Next.js's default compiler. Do not add `--webpack` to development, start, build, test, or other run scripts.
9. **Documentation Continuity**:
   - Update the relevant `docs/` files in the same change whenever product scope, architecture, models, operational policies, or milestone status changes.


---

## Deployment Safety

- Develop on `main`. Treat pushes to `feature/testing` as deployment-triggering and leave that branch for explicitly authorized deployments.
- Read the Azure deployment handoff in `docs/architecture.md` before deployment work. Inspect the current GitHub triggers and verify Azure settings before changing deployment behavior.
- Treat `.github/workflows/`, `next.config.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `lib/env.ts`, and auth/database code as deployment-critical. Make only task-required changes and report deployment impacts. Avoid unrelated infrastructure refactors or dependency major upgrades.
- Keep the pnpm version specified by `packageManager`. Use `pnpm install --frozen-lockfile` for reproducible installs; update `pnpm-lock.yaml` intentionally when changing dependencies. Do not introduce other package-manager lockfiles or use forced audit fixes.
- For the reported standalone deployment, preserve `output: "standalone"`, build before packaging, copy `public` when present and `.next/static` into the standalone artifact, and include required hidden files (especially `.next`). Verify generated `server.js` is at the deployed artifact root. Do not replace this with static export or a raw repository/dependency upload.
- Preserve the verified Azure startup and runtime settings. The handoff reports `node server.js`, platform-provided `PORT`, and `HOSTNAME=0.0.0.0`. Local `pnpm start` remains a separate `next start` command. Verify build/runtime Node compatibility before changing versions; do not freeze an unverified version split.

## Environment, Database & Authentication

- Never commit secrets or populated `.env` files, or expose them in logs, client bundles, or deployment artifacts. Ignored local environment files are allowed; `.env.example` must contain only non-secret placeholders.
- `lib/env.ts` validates `MONGODB_URI`, `BETTER_AUTH_SECRET` (at least 32 characters), `BETTER_AUTH_URL` (HTTP(S)), `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` at module import. Build-time imports may require these values even without database queries; do not bypass validation to pass a build.
- GitHub Actions build configuration and Azure runtime settings are separate. For new or changed variables, update `.env.example` and document whether each is required locally, at build time, at runtime, or in multiple places. Use appropriate secret stores for sensitive values.
- Isolate local/test databases from deployed data. Both Mongoose and Better Auth must select the database from `MONGODB_URI`; never hardcode credentials or database names. Do not assume deployed records are disposable.
- Preserve cached Mongoose connections and the shared native MongoClient. Avoid new import-time connections or unnecessary database queries during builds.
- For Azure-only database failures, inspect runtime configuration, Atlas network access, DNS/connectivity, and TLS before rewriting database code. Never disable TLS verification as a workaround.
- Keep `BETTER_AUTH_URL` environment-specific: localhost locally and the deployed HTTPS origin on Azure. Preserve the browser client's same-origin behavior and configure Google OAuth redirect URIs externally for both environments; do not hardcode localhost callbacks.

## Verification Before Completion or Deployment

- Review the final diff for accidental infrastructure changes, secrets/environment files, dependency churn, and localhost-only assumptions.
- For application/dependency changes, run `pnpm lint`, `pnpm typecheck`, relevant tests (`pnpm test`), and `pnpm build`. Install dependencies when missing or changed; do not reinstall for every documentation edit.
- Documentation-only changes require diff review and `pnpm lint`; no production build is required unless runtime/build configuration also changes.
- For auth/database changes, verify the relevant development flow. Run `pnpm test:smoke` only against a verified isolated development/test database, never production.
- Before deployment, verify the actual workflow, standalone output, artifact layout including static/public assets and hidden files, Node/runtime/startup settings, and build/runtime variables. Smoke-check the packaged server and asset delivery when packaging changes.
- Report checks actually run and any failures or missing prerequisites. Do not claim build/deployment readiness with a failed build or unverified deployment checks. Never deploy just to validate documentation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
