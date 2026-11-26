# Technical Architecture

## Stack Specification

| Component | Technology | Version | Usage & Responsibility |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `16.4.6` | App Router, Server Components, Route Handlers. |
| **UI Library** | React | `19.2.4` | Core view engine. |
| **Language** | TypeScript | `5.9.x` | Strict type checking (`tsconfig.json`). |
| **Styling** | Tailwind CSS | `v4` (`@tailwindcss/postcss`) | CSS-first custom properties and OKLCH color tokens. |
| **Database** | MongoDB Atlas | Managed Cluster | Document database host for all application collections. |
| **ODM** | Mongoose | `9.11.4` | Application models such as `TutorProfile` and `SavedTutor`. |
| **Auth Engine** | Better Auth | `1.7.7` | Identity and session management via native MongoDB driver. |
| **Validation** | Zod | `4.4+` | Schema validation for API payloads. |
| **Lint / Format** | Biome | `2.5+` | Formatting and linting (`pnpm lint`, `pnpm lint:fix`). |
| **Unit Tests** | Vitest | `4.1.12` | Domain and validation tests. |
| **Package Manager** | pnpm | `11.19.0` | Pinned dependency and workspace manager. |
| **Runtime** | Node.js | `>=22.13.0` | Minimum Node.js version required by the pinned pnpm release. |

---

## Directory Structure

```text
Tutoring-marketplace/
├── AGENTS.md                  # Short agent instructions & rules
├── docs/                      # Long-term repository context system
│   ├── project-context.md     # Product vision, scope, roadmap & current state
│   ├── architecture.md        # Technical stack, structure, routing & data models
│   ├── decisions.md           # Architectural & business decisions log
│   └── roadmap.md             # Milestones, current focus & acceptance criteria
├── proxy.ts                   # Next.js 16 route proxy middleware
├── app/                       # Next.js App Router root
│   ├── layout.tsx             # Root layout shell, font imports & theme script
│   ├── globals.css            # Tailwind v4 import & OKLCH color tokens
│   ├── page.tsx               # Homepage / landing page
│   ├── (auth)/                # Auth route group
│   │   ├── sign-in/page.tsx   # Sign-in page (loads SignInForm)
│   │   └── sign-up/page.tsx   # Sign-up page (redirects to sign-in tab)
│   ├── complete-profile/      # Tutor onboarding route (`page.tsx`)
│   ├── subjects/page.tsx      # Standalone Subjects We Teach catalog
│   ├── how-it-works/page.tsx  # Onboarding process guide
│   ├── about/page.tsx         # Platform mission, vision & values
│   ├── become-a-tutor/page.tsx# Tutor recruitment marketing page
│   ├── tutors/                # Verified-student discovery and `[slug]` profiles
│   ├── dashboard/             # Role-based dashboard shell & sub-routes
│   └── api/
│       └── auth/[...all]/     # Better Auth catch-all endpoint handler
├── components/                # React UI components
│   ├── layout/                # Navbar, MobileMenu, UserMenu, ThemeToggle
│   ├── forms/                 # SignInForm
│   ├── dashboard/             # Sidebar, MobileHeader, EmailVerificationPrompt
│   ├── tutors/                # Tutor editing, availability, and save controls
│   └── ui/                    # Base UI primitives (Button, Input, etc.)
├── lib/                       # Shared utilities and configurations
│   ├── auth.ts                # Better Auth server configuration & DB hooks
│   ├── auth-client.ts         # Better Auth React client instance
│   ├── auth-server.ts         # Server-side getSession() & requireSession()
│   ├── db.ts                  # Mongoose singleton connection manager
│   ├── env.ts                 # Runtime environment validation (Zod)
│   ├── slug.ts                # Tutor slug generation helpers
│   ├── availability.ts        # Availability overlap domain validation
│   ├── navigation.ts          # Internal callback URL safety
│   ├── permissions.ts         # Role and approval authorization checks
│   ├── policies.ts            # Central temporary marketplace policy values
│   ├── payment-instructions.ts# Server-only temporary collection accounts
│   ├── registration.ts        # Public registration role constraints
│   ├── tutor-search.ts         # URL filter parsing for tutor discovery
│   └── utils.ts               # Classname utility helpers (cn)
└── models/                    # Mongoose database models
    ├── TutorProfile.ts        # Tutor profile schema & discovery indexes
    └── SavedTutor.ts          # Unique student-to-tutor saves
```

---

## Routing & Protection Patterns

### Next.js 16 Proxy Convention
Next.js 16 replaces `middleware.ts` with **`proxy.ts`** at the project root as the official network boundary handler.

- **File**: `proxy.ts`, using the Next.js 16 named `proxy` export.
- **Protected Routes**: `/dashboard`, `/complete-profile`, `/tutors`.
- **Session Check**: Verifies `better-auth.session_token` or `__Secure-better-auth.session_token` cookie (note the **underscore**, not hyphen).
- **Redirect Behavior**:
  - Requests without a session cookie redirect to sign-in with the original path and query as the callback. Protected pages and actions validate the session and apply their own role checks.
  - Authenticated requests visiting `/sign-in` are redirected to `/dashboard` by `app/(auth)/sign-in/page.tsx`.

---

## Authentication Architecture

### Dual-Layer Storage Pattern
1. **Identity & Sessions (Better Auth)**: Managed natively via `better-auth/adapters/mongodb` directly using the MongoDB driver.
   - Collections: `user`, `session`, `account`, `verification`.
   - **Crucial Rule**: Do **NOT** wrap `user` or `session` collections in Mongoose models.
2. **Application Data (Mongoose)**: Domain models (`TutorProfile`, `Booking`, etc.) reference `userId` (string) as a foreign key matching `user.id` in MongoDB.

### Server & Client Instances
- **Server Instance (`lib/auth.ts`)**: Configures `mongodbAdapter(client.db(), { client })` with a shared native client.
  - `user.additionalFields`: `role` (default: `"student"`), `status` (default: `"active"`).
  - `user.create.before` hook: Resolves only `student` or `tutor` from the constrained `selected_role` cookie; admin is never public input.
  - `user.create.after` hook: Auto-creates a `TutorProfile` shell document in Mongoose if `user.role === "tutor"`.
- **Server Helpers (`lib/auth-server.ts`)**:
  - `getSession()`: Reads headers and calls `auth.api.getSession({ headers })`.
  - `requireSession()`: Throws error if `getSession()` is null.
- **Client Instance (`lib/auth-client.ts`)**: Uses `createAuthClient()` exporting `signIn`, `signUp`, `signOut`, `useSession`.
  - Uses Better Auth's same-origin default instead of a browser-exposed auth URL; the server's canonical URL remains `BETTER_AUTH_URL`.

### Environment Validation

- `lib/env.ts` validates server-only configuration before auth or database clients are created.
- `BETTER_AUTH_SECRET` must contain at least 32 characters; missing or invalid production configuration fails fast instead of falling back to Better Auth's development secret.
- The Better Auth MongoDB adapter receives the shared native `MongoClient`, enabling adapter-managed transactions where supported.
- The development mailer prints verification links. Production email signup requires a transactional mail implementation.
- `PAYMENT_RECEIVING_ACCOUNTS` is optional server-runtime JSON, read after the admin role check. Supply it privately in local or App Service settings when manual receiving instructions are needed. Build configuration does not require it.

---

## Database & Model Architecture

### Connection Management
`lib/db.ts` exports `connectDB()`, which manages a global cached Mongoose connection to prevent hot-reload connection leaks in development.
Failed connection attempts clear the cached promise so a transient outage does not permanently poison the process.

Both drivers take the database name from `MONGODB_URI`. Use an explicit name in
each environment. For local development, run a replica set because the Better
Auth adapter uses transactions.

### MongoDB connectivity troubleshooting

1. For `querySrv ENOTFOUND`, compare the configured Atlas hostname with the current Connect dialog, check that the cluster is running, and resolve its SRV record from the affected runtime.
2. Once SRV resolves, use a read-only driver ping and check Atlas Network Access against the affected runtime's actual outbound IP. Local and Azure egress can differ. A TLS failure happens before database credentials are accepted. Keep certificate verification enabled.
3. Once ping succeeds, verify the explicit database name, the database user's permissions (including index creation), and the Google OAuth callback for the app's origin. [Atlas connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)

### Foundation Integration Smoke

`pnpm test:smoke` reads `SMOKE_MONGODB_URI` from the shell or ignored
`.env.smoke.local`. It uses a confirmed isolated replica-set database and
cleans up its uniquely identified fixtures. The suite exercises credential
authentication, email verification, role enforcement, tutor server actions, and
discovery against real MongoDB.

### Application Models
- **`TutorProfile` (`models/TutorProfile.ts`)**:
  - `userId` (String, unique, indexed): Links to Better Auth `user.id`.
  - `slug` (String, unique, indexed): URL-friendly profile identifier.
  - Profile info: `headline`, `bio`, `subjects`, `languages`, `hourlyRate`, `currency`, `country`, `timezone`, `introVideoUrl`.
  - Scheduling: `availabilityRules` (array of `{ dayOfWeek, startTime, endTime }`), `lessonDurations` (array of numbers, e.g. `[60]`).
  - Private `scheduling` settings control tutor-local time-off dates, minimum notice, booking horizon, and a break after each lesson. Preexisting profiles get defaults at read time.
  - Moderation: `status` (`"draft"` | `"pending_review"` | `"approved"` | `"rejected"`), `isApproved` (Boolean, indexed).
- **`SavedTutor` (`models/SavedTutor.ts`)**:
  - Stores a student `user.id` and approved `TutorProfile` object id.
  - A unique compound index prevents duplicate saves for one student and tutor.
- **`Booking`**: UTC lesson interval and tutor buffer, participant and timezone snapshots, quoted minor-unit amount and currency, status, and hold deadline.
- **`StudentBookingLock`**: One sequence document per student. Booking creation writes this document and the tutor profile before checking overlaps and creating the hold in a MongoDB transaction.
- **`Payment`, `PaymentEvent`, `LedgerEntry`**: One intent per sandbox booking, verified delivery outcomes keyed by event ID, and append-only sandbox commission and pending tutor earning entries. Each document records its sandbox mode.
- **`RefundRequest`**: One sandbox request per cancelled booking, with a server-computed mock policy snapshot and the admin's review decision, note, and timestamp. Approval adds compensating ledger entries and changes the payment status in the same transaction.
- **Planned Models**: `Review`, `Payout`, `Message`.

### Discovery Boundary

- `/tutors` and `/tutors/[slug]` require a verified student session.
- Every list, detail, and save mutation requires both `status: "approved"` and `isApproved: true`.
- Student-safe tutor DTOs omit email and moderation-only fields.
- Filters are parsed from constrained URL parameters before reaching MongoDB; keyword regular expressions are escaped and length-limited.

### Tutor Moderation State Machine

```text
draft -> pending_review -> approved
                     \-> rejected -> draft
approved --edit--> draft
pending_review --edit--> draft
```

Only `pending_review` profiles may be approved or rejected. Discovery must require both `status: "approved"` and `isApproved: true`. Public-profile edits currently de-list an approved tutor until the new version is reviewed; versioned profile publishing may replace this conservative behavior later.

### Planned Transactional Boundaries

- An unpaid hold blocks competing reservations until its deadline or owner release. Expiry is enforced by queries and preserves the booking record for future reconciliation. The hold transaction reads approval, the latest schedule, price, and competing bookings while holding both participant locks. Each student may have up to three active holds.
- The local simulator signs event bodies server-side. Event handling serializes by payment intent and reuses both booking participant locks before a guarded confirmation. Valid capture, ledger posting and event persistence commit together. A failed event leaves the booking held, and a capture outside the hold deadline enters reconciliation. Refund settlements and payouts require further workflows.
- `Conversation` / `Message`: booking-scoped participant communication.
- Agora tokens will be issued server-side only for valid booking participants and allowed join windows.

---

## Design System & Theme Architecture

### Styling Stack
Tailwind CSS v4 is configured via `@import "tailwindcss";` in `app/globals.css`.

### Custom OKLCH Tokens & Dark Mode
- Theme switching uses Tailwind's `@custom-variant dark (&:is(.dark *));`.
- Light theme (`:root`): Cozy cream background (`oklch(0.95 0.012 75)`), soft off-white cards (`oklch(0.98 0.008 75)`), warm brown primary (`oklch(0.47 0.08 55)`).
- Dark theme (`.dark`): Soft dark background (`oklch(0.15 0.015 55)`), muted card surfaces (`oklch(0.2 0.02 55)`).
- **`--color-white` Mapping**: `@theme inline` maps `--color-white: var(--theme-white)`. `--theme-white` is mapped to `var(--card)` in both light and dark themes. This ensures standard `bg-white` components seamlessly adapt to theme changes.

### Hydration Mismatch Safety
- `<head>` inline script in `app/layout.tsx` reads `localStorage.theme` and `prefers-color-scheme` to set `.dark` synchronously before render.
- `app/layout.tsx` uses `suppressHydrationWarning` on `<html>` to ignore React's client/server class attribute discrepancy warning.
- `<ThemeToggle />` component handles user interaction and persists selection to `localStorage`.


---

## Azure deployment handoff

The user reports a successful Azure App Service testing deployment of `feature/testing` (September 17, 2026). Treat pushes to this branch as deployment-triggering.

GitHub Actions history shows successful push-triggered runs from `feature/testing`.
The workflow targets the Azure App Service `Production` slot. On `main`, its
push filter and build job guard limit execution to `feature/testing`, including
manual dispatch. The build uses pnpm 11.19.0 with the frozen lockfile on Node.js
24.x. Standalone packaging copies `public` and `.next/static` and includes hidden
files at upload.

The handoff reports Linux App Service, Node.js 22 LTS, startup via `node server.js`,
platform-provided `PORT`, and `HOSTNAME=0.0.0.0`. Verify those settings and the
runtime patch level in Azure before deploying. For a local production smoke,
run the packaged standalone server with its static and public assets copied in.

`lib/env.ts` validates five server variables on import, so builds may need configuration as well as Azure runtime. Build configuration does not automatically populate App Service settings. See `AGENTS.md` for environment, packaging, and verification rules.
