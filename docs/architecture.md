# Technical Architecture

## Stack Specification

| Component | Technology | Version | Usage & Responsibility |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `16.3.0` | App Router, Server Components, Route Handlers. |
| **UI Library** | React | `19.2.4` | Core view engine. |
| **Language** | TypeScript | `5.9.x` | Strict type checking (`tsconfig.json`). |
| **Styling** | Tailwind CSS | `v4` (`@tailwindcss/postcss`) | CSS-first custom properties and OKLCH color tokens. |
| **Database** | MongoDB Atlas | Managed Cluster | Document database host for all application collections. |
| **ODM** | Mongoose | `9.7.4` | Application models (`TutorProfile`, `Booking`, etc.). |
| **Auth Engine** | Better Auth | `1.6+` | Identity, session management via native MongoDB driver. |
| **Validation** | Zod | `4.4+` | Schema validation for API payloads. |
| **Lint / Format** | Biome | `2.5+` | Formatting and linting (`pnpm lint`, `pnpm lint:fix`). |
| **Unit Tests** | Vitest | `4.1.5` | Fast domain, validation, and component-adjacent tests. |
| **Package Manager** | pnpm | Locked | Dependency and workspace manager. |
| **Runtime** | Node.js | `>=20.19.0` | Minimum shared requirement for Next.js 16, Mongoose 9, and Vitest 4. |

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
  - Unauthenticated requests to protected paths are redirected to `/sign-in?callbackUrl=<pathname>`.
  - Authenticated requests visiting `/sign-in` are redirected to `/dashboard` by `app/(auth)/sign-in/page.tsx`.

---

## Authentication Architecture

### Dual-Layer Storage Pattern
1. **Identity & Sessions (Better Auth)**: Managed natively via `better-auth/adapters/mongodb` directly using the MongoDB driver.
   - Collections: `user`, `session`, `account`, `verification`.
   - **Crucial Rule**: Do **NOT** wrap `user` or `session` collections in Mongoose models.
2. **Application Data (Mongoose)**: Domain models (`TutorProfile`, `Booking`, etc.) reference `userId` (string) as a foreign key matching `user.id` in MongoDB.

### Server & Client Instances
- **Server Instance (`lib/auth.ts`)**: Configures `betterAuth({ database: mongodbAdapter(client.db()), ... })`.
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

---

## Database & Model Architecture

### Connection Management
`lib/db.ts` exports `connectDB()`, which manages a global cached Mongoose connection to prevent hot-reload connection leaks in development.
Failed connection attempts clear the cached promise so a transient outage does not permanently poison the process.

### Foundation Integration Smoke

`pnpm test:smoke` exercises Better Auth signup and tutor moderation against the
configured development MongoDB database. Each run uses unique email, user, and
slug identifiers and removes only those exact records in teardown. The smoke test
must never be pointed at a production database.

### Application Models
- **`TutorProfile` (`models/TutorProfile.ts`)**:
  - `userId` (String, unique, indexed): Links to Better Auth `user.id`.
  - `slug` (String, unique, indexed): URL-friendly profile identifier.
  - Profile info: `headline`, `bio`, `subjects`, `languages`, `hourlyRate`, `currency`, `country`, `timezone`, `introVideoUrl`.
  - Scheduling: `availabilityRules` (array of `{ dayOfWeek, startTime, endTime }`), `lessonDurations` (array of numbers, e.g. `[60]`).
  - Moderation: `status` (`"draft"` | `"pending_review"` | `"approved"` | `"rejected"`), `isApproved` (Boolean, indexed).
- **`SavedTutor` (`models/SavedTutor.ts`)**:
  - Stores a student `user.id` and approved `TutorProfile` object id.
  - A unique compound index prevents duplicate saves for one student and tutor.
- **Planned Models**: `Booking`, `Payment`, `Review`, `Payout`, `RefundRequest`, `Message`.

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

- `Booking`: one purchased lesson, UTC schedule, participant timezone snapshots, lifecycle state.
- `BookingHold`: short-lived slot reservation used during checkout and enforced atomically.
- `Payment`: gateway attempt and reconciliation record using integer minor units.
- `LedgerEntry`: append-only platform commission, tutor earning, refund, adjustment, and payout entries.
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
