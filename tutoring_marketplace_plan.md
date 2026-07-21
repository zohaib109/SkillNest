# Tutoring Marketplace - Crystal Clear 2026 Implementation Plan

## Summary

We are planning a **greenfield tutoring marketplace** inspired by Preply, but with a calmer, cleaner, more human UI and a more focused launch strategy.

This plan now locks the major product and architecture decisions:

- **Audience at launch**: global students, Pakistan-first tutors
- **Business model**: platform commission marketplace
- **Booking model**: single paid lessons first
- **Launch order**: marketplace core first, messaging and live lessons after core transactions work
- **Tutor payouts**: manual first, automated later
- **Tutor moderation**: admin approval required before profiles go live
- **Design direction**: warm editorial minimal
- **Auth direction**: modern App Router-first Auth.js v5 beta

This document is intentionally more specific than the previous one. It is written so an executor can build the app step by step without inventing missing architecture decisions midway.

---

## Current State Analysis

### What exists today

From local exploration of the repository:

- The repo is effectively **empty** from an application-code perspective.
- The only meaningful project artifact currently present is:
  - `.trae/documents/tutoring_marketplace_plan.md`

### What that means

- This is a **true greenfield build**.
- We are not constrained by existing source code, routing, schemas, or deployment config.
- The plan must therefore define:
  - the initial file structure,
  - the exact technology choices,
  - the first implementation order,
  - the boundaries of v1 vs later upgrades.

---

## Assumptions And Final Decisions

### Product decisions

1. The app is a **real transaction marketplace**, not just a tutor directory.
2. Students can browse tutors globally, but initial tutor operations are **Pakistan-first**.
3. Students will buy **single lessons** first.
4. The marketplace will earn by taking a **platform commission** from each paid booking.
5. Tutors will be paid **manually by admins at first**.
6. Tutor profiles require **admin approval** before going live.
7. Tutor intro videos will use **YouTube/Vimeo links**, not direct uploads.
8. Time handling will use **UTC in storage** and **local timezone display** in the UI.
9. Auth will support **email/password + Google**.
10. The first serious launch milestone is **core marketplace**, then messaging and live lessons.
11. First launch language scope is **English only**.
12. Lesson duration will use **tutor-selected fixed options** rather than a single universal duration or freeform student input.
13. Refunds will be **admin-reviewed first**, not fully self-serve.

### Design decisions

1. The UI should feel:
   - modern,
   - clean,
   - soft,
   - fast,
   - easy to understand,
   - distinct without looking flashy or “high-tech”.
2. The visual direction is **warm editorial minimal**:
   - soft colors,
   - generous spacing,
   - strong typography,
   - fast micro-interactions,
   - minimal page reload feel,
   - premium but approachable.

### Technology decisions

These are the stack choices we should lock into the build plan as of **July 2026**.

| Layer | Decision | Why |
| :--- | :--- | :--- |
| Framework | **Next.js 16.2.10** | Current stable line, App Router-first, strong SSR/SEO, good fit for marketplace pages. |
| React | **React 19.2.x** | Stable with Next.js 16 and current shadcn/Tailwind patterns. |
| TypeScript | **TypeScript 5.9.x initially** | This is the most important correction: TS 7 is real, but Next.js 16 still requires an experimental path for it. For a production-first launch, we should start on the mature 5.9 line and upgrade later. |
| Styling | **Tailwind CSS 4.3.2** | Current stable Tailwind v4 line with CSS-first theming. |
| Components | **shadcn/ui latest Tailwind-v4-compatible CLI/components** | Best fit for owned code, accessibility, and fast customization. |
| Database | **MongoDB Atlas** | Managed MongoDB is a better fit than self-hosting MongoDB on Hostinger. |
| ODM | **Mongoose 9.7.4** | Current stable line with mature ecosystem support. |
| Auth | **Auth.js v5 beta line (`next-auth@5 beta`)** | Chosen because you explicitly preferred the modern-first auth direction. We are accepting beta-package risk for cleaner App Router patterns. |
| Lint/format | **@biomejs/biome 2.5.2** | Current stable line and aligned with your tooling rule. |
| Payments | **Stripe first + local wallet integration second** | Best global coverage plus local Pakistani payment support. |
| Video | **Agora** | Fastest route to reliable browser-based live lessons. |
| Package manager | **pnpm** | Required by your rules. |

### Important compatibility call

We should **not** start this app on TypeScript 7 for v1.

Reason:

- TypeScript 7 became stable in July 2026, but Next.js 16 still treats it as a special-case path and relies on an experimental setting for build-time type checking.
- For a production marketplace involving auth and payments, the safer recommendation is:
  - **Phase 1-9**: TypeScript 5.9.x
  - **Later upgrade task**: move to TS 7 once Next’s integration path is no longer experimental or no longer operationally risky

That gives us modern everything else without turning the foundation into an adoption experiment.

---

## Proposed Project Structure

Because the repo is greenfield, these are the files and folders the implementation should create.

### Root and config

- `package.json`
  - Define scripts, dependencies, and pnpm package metadata.
- `pnpm-lock.yaml`
  - Lock versions for repeatable installs.
- `next.config.ts`
  - Minimal Next.js config, image domains, production-safe flags.
- `tsconfig.json`
  - Strict TypeScript config aligned with Next.js 16 and TS 5.9.
- `biome.json`
  - Formatting, linting, import organization, and repo-wide rules.
- `.env.example`
  - Document all required environment variables.
- `.gitignore`
  - Standard Next.js + env + build outputs.
- `components.json`
  - shadcn/ui configuration for Tailwind v4 setup.

### App router layout

- `app/layout.tsx`
  - Global shell, fonts, providers, metadata root.
- `app/globals.css`
  - Tailwind v4 import, theme tokens, base styles, editorial color system, spacing rhythm.
- `app/page.tsx`
  - Homepage / marketing landing page.

### Public marketing and discovery routes

- `app/tutors/page.tsx`
  - Tutor listing/search page.
- `app/tutors/[slug]/page.tsx`
  - Tutor profile page with bio, price, subjects, reviews, booking CTA.
- `app/about/page.tsx`
  - Trust and platform explanation page.
- `app/how-it-works/page.tsx`
  - Student and tutor onboarding explanation.

### Auth routes

- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- `app/(auth)/complete-profile/page.tsx`

### Dashboard routes

- `app/dashboard/student/page.tsx`
  - Upcoming lessons, past lessons, payments, join buttons later.
- `app/dashboard/student/bookings/page.tsx`
- `app/dashboard/tutor/page.tsx`
  - Profile completion, availability, booking requests, earnings ledger view.
- `app/dashboard/tutor/profile/page.tsx`
- `app/dashboard/tutor/availability/page.tsx`
- `app/dashboard/admin/page.tsx`
  - Admin summary dashboard.
- `app/dashboard/admin/tutors/page.tsx`
  - Tutor approval workflow.
- `app/dashboard/admin/payouts/page.tsx`
  - Manual payout tracking.
- `app/dashboard/admin/bookings/page.tsx`
  - Booking oversight and support actions.

### Route handlers and backend endpoints

- `app/api/auth/[...nextauth]/route.ts`
  - Auth.js handlers.
- `app/api/tutors/search/route.ts`
  - Search/filter endpoint if server action is not ideal for the final UX.
- `app/api/bookings/route.ts`
  - Booking creation and retrieval.
- `app/api/payments/stripe/checkout/route.ts`
  - Stripe checkout/session creation.
- `app/api/payments/stripe/webhook/route.ts`
  - Stripe webhook processing.
- `app/api/payments/local/initiate/route.ts`
  - Local wallet payment initiation.
- `app/api/payments/local/callback/route.ts`
  - Local wallet callback verification.
- `app/api/agora/token/route.ts`
  - Secure lesson-room token generation.

### Shared libraries

- `auth.ts`
  - Auth.js root configuration export.
- `auth.config.ts`
  - Shared auth config split for safer App Router usage.
- `proxy.ts`
  - Route protection and auth-aware redirects.
- `lib/db.ts`
  - MongoDB/Mongoose connection singleton.
- `lib/env.ts`
  - Runtime-safe environment parsing/validation.
- `lib/slug.ts`
  - Tutor slug generation helpers.
- `lib/timezone.ts`
  - UTC conversion and display helpers.
- `lib/currency.ts`
  - Currency display and amount normalization helpers.
- `lib/payments/stripe.ts`
  - Stripe SDK and helpers.
- `lib/payments/local-wallets.ts`
  - Local wallet abstraction for PayFast/bSecure.
- `lib/agora.ts`
  - Agora token and room helpers.
- `lib/permissions.ts`
  - Role and approval checks.

### Database models

- `models/User.ts`
- `models/TutorProfile.ts`
- `models/Booking.ts`
- `models/Payment.ts`
- `models/Review.ts`
- `models/Message.ts`
- `models/Payout.ts`

### UI building blocks

- `components/layout/*`
- `components/marketing/*`
- `components/tutors/*`
- `components/forms/*`
- `components/dashboard/*`
- `components/shared/*`

### Server actions

- `actions/auth/*`
- `actions/tutors/*`
- `actions/bookings/*`
- `actions/reviews/*`
- `actions/admin/*`

---

## Data Model Plan

### `users`

- identity and auth record
- roles: `student | tutor | admin`
- stores approval-independent base account info

Suggested fields:

- `_id`
- `email`
- `passwordHash` for credentials auth
- `googleId` optional
- `role`
- `name`
- `avatarUrl`
- `emailVerified`
- `status` (`active | suspended`)
- `createdAt`
- `updatedAt`

### `tutor_profiles`

- tutor-specific public and operational data

Suggested fields:

- `userId`
- `slug`
- `headline`
- `bio`
- `subjects`
- `languages`
- `hourlyRate`
- `currency`
- `introVideoUrl`
- `country`
- `timezone`
- `availabilityRules`
- `isApproved`
- `approvedAt`
- `approvedBy`
- `ratingAverage`
- `reviewCount`

### `bookings`

- one booking = one lesson purchase in v1

Suggested fields:

- `studentId`
- `tutorId`
- `tutorProfileId`
- `lessonDurationMinutes`
- `startAtUtc`
- `endAtUtc`
- `studentTimezoneAtBooking`
- `tutorTimezoneAtBooking`
- `status` (`pending_payment | confirmed | completed | cancelled | disputed`)
- `meetingProvider` (`agora`)
- `meetingRoomId`
- `joinWindowOpensAtUtc`

### `payments`

- transaction ledger for Stripe and local wallet records

Suggested fields:

- `bookingId`
- `studentId`
- `tutorId`
- `gateway` (`stripe | local_wallet`)
- `gatewayReference`
- `amountSubtotal`
- `platformFee`
- `tutorAmountOwed`
- `currency`
- `status` (`initiated | pending | paid | failed | refunded`)
- `paidAt`

### `refund_requests`

- manual-first refund handling for the first launch

Suggested fields:

- `bookingId`
- `paymentId`
- `studentId`
- `reason`
- `status` (`open | approved | denied | processed`)
- `reviewedBy`
- `reviewNotes`
- `createdAt`
- `updatedAt`

### `payouts`

- required because payouts are manual first

Suggested fields:

- `tutorId`
- `paymentIds`
- `totalAmount`
- `currency`
- `method`
- `status` (`pending | sent | confirmed | failed`)
- `notes`
- `processedBy`
- `processedAt`

### `reviews`

- linked only to completed lessons

### `messages`

- phase-later internal messaging records

---

## Feature Scope By Phase

## Phase 1 - Foundation

Goal: create the stable base of the app with no marketplace behavior yet.

Deliverables:

- Next.js 16 app scaffold
- Tailwind v4 + shadcn/ui setup
- Biome setup
- MongoDB Atlas connection
- env management
- global layout and design tokens

Acceptance criteria:

- app boots locally
- Biome runs cleanly
- MongoDB connection succeeds
- base layout is responsive and matches the warm editorial direction

## Phase 2 - Authentication

Goal: secure sign-up, sign-in, session, route protection.

Deliverables:

- email/password auth
- Google sign-in
- Auth.js v5 beta setup
- protected dashboard routes
- role-aware redirects

Acceptance criteria:

- student sign-up works
- tutor sign-up works
- Google auth works
- anonymous users cannot access protected dashboard pages
- users land in the correct dashboard based on role and profile state

## Phase 3 - Tutor onboarding and moderation

Goal: tutors can create profiles, but only approved tutors become public.

Deliverables:

- tutor onboarding form
- intro video URL support
- subject/language/hourly-rate setup
- availability rule editor
- admin approval workflow

Acceptance criteria:

- tutor can save draft profile
- admin can approve or reject
- only approved tutors appear in search

## Phase 4 - Discovery marketplace

Goal: students can find and evaluate tutors.

Deliverables:

- tutor search page
- subject/language/price filters
- tutor public profile page
- review display

Acceptance criteria:

- search/filter feels fast
- profile pages are SEO-friendly
- approved tutors only

## Phase 5 - Booking and scheduling

Goal: students can pick a slot and create a bookable lesson request.

Deliverables:

- timezone-safe availability rendering
- tutor-configurable fixed lesson durations
- slot selection UI
- booking record creation
- pending-payment booking status

Acceptance criteria:

- slot times display correctly in local timezone
- overlapping bookings are blocked
- booking record is created once
- chosen lesson duration is one of the tutor’s allowed fixed options

## Phase 6 - Payments

Goal: confirm lessons only after successful payment.

Deliverables:

- Stripe card payments
- later-in-phase local wallet option
- fee split accounting in payment records
- webhook/callback reconciliation
- admin-reviewed refund request flow

Acceptance criteria:

- paid booking becomes confirmed
- failed payment does not confirm booking
- platform fee and tutor amount owed are stored correctly
- refund decisions can be tracked without requiring automated instant refunds

## Phase 7 - Dashboards and operations

Goal: make the marketplace operable day to day.

Deliverables:

- student bookings dashboard
- tutor booking and earnings view
- admin payout ledger
- admin booking oversight tools
- admin refund review tools

Acceptance criteria:

- admins can see which tutors are owed money
- tutors can see lessons and earnings history
- students can see upcoming and past lessons

## Phase 8 - Messaging

Goal: add in-app tutor-student coordination.

Deliverables:

- booking-linked messaging threads
- unread state
- polling-based real-time refresh first

Acceptance criteria:

- message threads work reliably
- unread/read state updates correctly

## Phase 9 - Live lessons

Goal: add browser-based live lesson room.

Deliverables:

- Agora token endpoint
- lesson room UI
- join button activation window
- camera/mic/screen controls

Acceptance criteria:

- only valid participants can join
- join button opens near lesson time only
- basic call controls work in two-browser-session testing

## Phase 10 - Deployment and production hardening

Goal: put the app on Hostinger safely.

Deliverables:

- production build process
- Hostinger Node deployment steps
- PM2 process management
- env configuration
- domain/SSL checklist

Acceptance criteria:

- app runs after server restart
- envs load correctly
- payment webhooks/callback URLs are production-valid

---

## Specific Implementation Notes

### Auth implementation

- We will use **Auth.js v5 beta** because you chose the modern-first direction.
- We should still treat this as a managed risk:
  - pin the exact beta version during implementation,
  - avoid frequent auth package churn,
  - keep authorization checks server-side, not middleware-only.

### Payment implementation

- **Stripe** should be the primary v1 payment path.
- Local wallets should be integrated as a secondary regional option.
- Because payouts are manual first, we do **not** need Stripe Connect in v1.
- That is a major simplification and the right choice for launch.
- Refunds should also be **manual/admin-reviewed first**, which keeps trust high without forcing fully automated refund logic into v1.

### Geography and money flow

- Students can be global.
- Tutors are Pakistan-first operationally.
- Prices should still support multi-currency display where possible, but settlement logic can remain simpler because tutor payouts are manual.

### Scheduling

- Store canonical times in UTC.
- Store the participant timezones used at booking time for audit clarity.
- Display local times in the interface everywhere users interact with lessons.
- Tutors define their supported fixed lesson durations, and bookings must match one of those allowed options.

### Language strategy

- Launch in **English only**.
- Do not add i18n routing, translation dictionaries, or multilingual content architecture in v1.
- Keep copy structure clean so Urdu/localization can be introduced later without a rewrite.

### UI/UX implementation direction

- Prefer Server Components where possible.
- Keep client-side state local and intentional.
- Use loading states and optimistic updates carefully to avoid “page reload” feel.
- Animation style:
  - short,
  - subtle,
  - useful,
  - never decorative at the cost of speed.

---

## Out Of Scope For First Launch

These should **not** be mixed into the initial build unless explicitly reprioritized:

- automated tutor payouts
- multi-lesson packages
- subscriptions
- tutor direct video uploads/storage pipeline
- full international tax/compliance automation
- marketplace mobile app
- deep AI tutor matching or recommendation engine
- complex real-time socket infrastructure from day one
- TypeScript 7 adoption in the first release cycle

---

## Verification Plan

### Functional verification

1. Auth:
   - email/password signup
   - Google signup/login
   - session persistence
   - protected route enforcement
2. Tutor moderation:
   - unapproved tutor hidden from public discovery
   - approved tutor becomes searchable
3. Search:
   - subject, price, language filters work
4. Booking:
   - timezone-safe slot rendering
   - duplicate/overlap prevention
   - tutor-approved fixed duration enforcement
5. Payments:
   - Stripe success path
   - Stripe failure path
   - local wallet callback verification
   - admin refund request creation and review flow
6. Operations:
   - admin can track tutor approval and payouts
7. Live lessons:
   - valid room token generation
   - two-user lesson join test

### Technical verification

1. `pnpm install`
2. `pnpm biome check .`
3. `pnpm build`
4. database connection smoke test
5. auth smoke test
6. payment sandbox/webhook test
7. responsive testing on mobile, tablet, desktop

### UX verification

1. First-load speed feels good on the marketing pages.
2. Search/filter interactions feel immediate.
3. Forms are clear and forgiving.
4. Typography, spacing, and color feel consistent across routes.
5. The UI feels premium and calm, not generic and not flashy.

---

## Recommended Build Order

When we begin execution, we should work in this exact order:

1. foundation
2. auth
3. tutor onboarding + admin approval
4. tutor discovery
5. booking
6. Stripe payments
7. dashboards + manual payouts ledger
8. local wallets
9. messaging
10. live lessons
11. deployment hardening

This order keeps complexity under control and ensures the marketplace works commercially before we add the heavier communication features.
