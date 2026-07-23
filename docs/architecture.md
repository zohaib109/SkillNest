# Technical Architecture

## Stack Specification

| Component | Technology | Version | Usage & Responsibility |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `16.2.10` | App Router, Server Components, Route Handlers. |
| **UI Library** | React | `19.2.4` | Core view engine. |
| **Language** | TypeScript | `5.9.x` | Strict type checking (`tsconfig.json`). |
| **Styling** | Tailwind CSS | `v4` (`@tailwindcss/postcss`) | CSS-first custom properties and OKLCH color tokens. |
| **Database** | MongoDB Atlas | Managed Cluster | Document database host for all application collections. |
| **ODM** | Mongoose | `9.7.4` | Application models (`TutorProfile`, `Booking`, etc.). |
| **Auth Engine** | Better Auth | `1.6+` | Identity, session management via native MongoDB driver. |
| **Validation** | Zod | `4.4+` | Schema validation for API payloads. |
| **Lint / Format** | Biome | `2.5+` | Formatting and linting (`pnpm lint`, `pnpm lint:fix`). |
| **Package Manager** | pnpm | Locked | Dependency and workspace manager. |

---

## Directory Structure

```text
Tutoring-marketplace/
├── AGENTS.md                  # Short agent instructions & rules
├── docs/                      # Long-term repository context system
│   ├── project-context.md     # Product vision, scope, roadmap & current state
│   ├── architecture.md        # Technical stack, structure, routing & data models
│   └── decisions.md           # Architectural & business decisions log
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
│   ├── tutors/                # Tutor discovery routes (protected)
│   ├── dashboard/             # Role-based dashboard shell & sub-routes
│   └── api/
│       └── auth/[...all]/     # Better Auth catch-all endpoint handler
├── components/                # React UI components
│   ├── layout/                # Navbar, MobileMenu, UserMenu, ThemeToggle
│   ├── forms/                 # SignInForm
│   ├── dashboard/             # Sidebar, MobileHeader, EmailVerificationPrompt
│   ├── tutors/                # TutorProfileForm, AvailabilityEditor, TutorOnboardingForm
│   └── ui/                    # Base UI primitives (Button, Input, etc.)
├── lib/                       # Shared utilities and configurations
│   ├── auth.ts                # Better Auth server configuration & DB hooks
│   ├── auth-client.ts         # Better Auth React client instance
│   ├── auth-server.ts         # Server-side getSession() & requireSession()
│   ├── db.ts                  # Mongoose singleton connection manager
│   ├── env.ts                 # Runtime environment validation (Zod)
│   ├── slug.ts                # Tutor slug generation helpers
│   ├── permissions.ts         # Role and approval authorization checks
│   └── utils.ts               # Classname utility helpers (cn)
└── models/                    # Mongoose database models
    └── TutorProfile.ts        # Tutor profile schema & model definition
```

---

## Routing & Protection Patterns

### Next.js 16 Proxy Convention
Next.js 16 replaces `middleware.ts` with **`proxy.ts`** at the project root as the official network boundary handler.

- **File**: `proxy.ts`
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
  - `user.create.before` hook: Assigns user role from request body or `selected_role` cookie.
  - `user.create.after` hook: Auto-creates a `TutorProfile` shell document in Mongoose if `user.role === "tutor"`.
- **Server Helpers (`lib/auth-server.ts`)**:
  - `getSession()`: Reads headers and calls `auth.api.getSession({ headers })`.
  - `requireSession()`: Throws error if `getSession()` is null.
- **Client Instance (`lib/auth-client.ts`)**: Uses `createAuthClient()` exporting `signIn`, `signUp`, `signOut`, `useSession`.

---

## Database & Model Architecture

### Connection Management
`lib/db.ts` exports `connectDB()`, which manages a global cached Mongoose connection to prevent hot-reload connection leaks in development.

### Application Models
- **`TutorProfile` (`models/TutorProfile.ts`)**:
  - `userId` (String, unique, indexed): Links to Better Auth `user.id`.
  - `slug` (String, unique, indexed): URL-friendly profile identifier.
  - Profile info: `headline`, `bio`, `subjects`, `languages`, `hourlyRate`, `currency`, `country`, `timezone`, `introVideoUrl`.
  - Scheduling: `availabilityRules` (array of `{ dayOfWeek, startTime, endTime }`), `lessonDurations` (array of numbers, e.g. `[60]`).
  - Moderation: `status` (`"draft"` | `"pending"` | `"approved"` | `"rejected"`), `isApproved` (Boolean, indexed).
- **Planned Models**: `Booking`, `Payment`, `Review`, `Payout`, `RefundRequest`, `Message`.

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
