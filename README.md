# SkillNest

SkillNest is a transactional tutoring marketplace for international students and Pakistan-first tutors. Students will find approved tutors, book and pay for individual lessons, coordinate through booking-linked messages, and attend lessons in an Agora-powered browser classroom.

## Stack

- Next.js 16 App Router and React 19
- TypeScript 5.9
- Tailwind CSS 4
- Better Auth with MongoDB adapter
- MongoDB Atlas and Mongoose for application-domain data
- Zod validation, Biome formatting/linting, and Vitest

## Local Setup

1. Install Node.js 20.19 or newer (required by Mongoose 9) and pnpm 11.19.
2. Copy `.env.example` to `.env.local` and replace every placeholder.
3. Install dependencies with `pnpm install`.
4. Run `pnpm dev` and open `http://localhost:3000`.

Use pnpm only. Local development uses the default Next.js compiler.

## Quality Commands

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:smoke
pnpm audit --prod
```

`pnpm test:smoke` uses the configured development MongoDB database. It creates
uniquely named test records and removes only those records when the run finishes.
Do not point this command at a production database.

`BETTER_AUTH_SECRET` must be a high-entropy value of at least 32 characters. The
auth client intentionally uses same-origin requests, so no public auth URL
environment variable is required.

## Repository Context

Read these files before changing architecture or feature scope:

- `docs/project-context.md` — product vision, launch scope, and current state.
- `docs/architecture.md` — stack, routing, auth, data boundaries, and model direction.
- `docs/decisions.md` — binding technical and business decisions.
- `docs/roadmap.md` — current milestone, implementation order, and acceptance criteria.

Keep the relevant documentation updated in the same change as material code, product, policy, or architecture changes.
