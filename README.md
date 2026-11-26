# SkillNest

SkillNest helps adult university students find Pakistan-based tutors for individual academic lessons, starting with introductory Python. Its pilot connects a specific learning goal to a bookable lesson, a transparent price and an independent practice exercise. See the [product specification](docs/pilot-spec.md) and [current verification record](docs/execution.md).

## Stack

- Next.js 16 App Router and React 19
- TypeScript 5.9
- Tailwind CSS 4
- Better Auth with MongoDB adapter
- MongoDB Atlas and Mongoose for application-domain data
- Zod validation, Biome formatting/linting, and Vitest

## Local Setup

1. Install Node.js 22.13 or newer and pnpm 11.19.0 (the version pinned in `package.json`).
2. Start a local MongoDB replica set or use a confirmed development Atlas cluster.
3. Copy `.env.example` to `.env.local`. Set `MONGODB_URI` with an explicit development database name, generate a random auth secret, and set the Google OAuth credentials for the local app.
4. Install dependencies with `pnpm install --frozen-lockfile`.
5. Run `pnpm dev` and open `http://localhost:3000`.

Use pnpm only. Local development uses the default Next.js compiler.

## Quality Commands

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

For integration checks, set `SMOKE_MONGODB_URI` in your shell or in
`.env.smoke.local` to a confirmed isolated development replica set with an
explicit database name, then run `pnpm test:smoke`. The suite uses the actual
Better Auth handler, server actions, discovery queries, and booking transactions.
It generates unique fixture records and removes them at the end.

### Local sandbox checkout

Use a dedicated loopback replica-set database and opt in locally. For example:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/skillnest_sandbox_checkout?replicaSet=rs0&directConnection=true
BETTER_AUTH_URL=http://localhost:3000
SKILLNEST_ENABLE_SANDBOX_PAYMENTS=true
```

After creating a hold, choose **Simulate payment** in **My Bookings**. This
confirms a sandbox lesson and writes test ledger entries. The simulator is
disabled in production. To include sandbox event and reconciliation acceptance
in `pnpm test:smoke`, set `SMOKE_MONGODB_URI` to a separate isolated database
with the same URI shape. The test enables the simulator for its fixture run.

`BETTER_AUTH_SECRET` must be a high-entropy value of at least 32 characters. The
auth client intentionally uses same-origin requests, so no public auth URL
environment variable is required.

For Google sign-in, register `http://localhost:3000/api/auth/callback/google` in
the development OAuth client. Email verification links are printed by the local
development server. A production mail provider is still required for email signup.
See [MongoDB connectivity troubleshooting](docs/architecture.md#mongodb-connectivity-troubleshooting)
for SRV and TLS failures.

For the admin payments reference, supply `PAYMENT_RECEIVING_ACCOUNTS` as
server-side JSON in local or hosted runtime settings. See
`lib/payment-instructions.ts` for the field names. The payments page can run
without this optional setting.

## Repository Context

Read these files before changing architecture or feature scope:

- `docs/project-context.md` — product vision, launch scope, and current state.
- `docs/architecture.md` — stack, routing, auth, data boundaries, and model direction.
- `docs/decisions.md` — binding technical and business decisions.
- `docs/roadmap.md` — current milestone, implementation order, and acceptance criteria.

Keep the relevant documentation updated in the same change as material code, product, policy, or architecture changes.
