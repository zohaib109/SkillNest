# Project Context

## Product Vision

**SkillNest** is a transactional online tutoring marketplace inspired by Preply, designed with a calmer, cleaner, more editorial aesthetic and a focused launch strategy. It connects global students with verified tutors for high-quality, personalized 1-on-1 virtual lessons.

Unlike fast-paced lesson mills, SkillNest prioritizes focused growth, transparent single-lesson transactions, human connection, and long-term skill retention.

---

## Current MVP Scope & Priorities

1. **Transaction Model**: Single paid lessons first. No forced subscriptions, billing lock-in, or multi-lesson package requirements in v1.
2. **Target Audience**:
   - **Students**: Global audience.
   - **Tutors**: Pakistan-first launch focus for operations and recruitment.
3. **Tutor Onboarding & Moderation**: Tutor profiles require mandatory admin review and approval (`status: "approved"`, `isApproved: true`) before appearing in search or discovery catalogs.
4. **Payouts & Refunds**:
   - **Tutor Payouts**: Handled manually by admins in v1 via earnings ledger tracking (no Stripe Connect required for launch).
   - **Refunds**: Admin-reviewed flow, not automated self-serve instant refunds.
5. **Video Lessons**: Tutor intro videos use YouTube/Vimeo URLs (no direct video hosting pipeline). Live lessons will use browser-native Agora WebRTC integration.
6. **Timezone Architecture**: Canonical times stored in UTC; displayed in the user's local timezone on the UI.
7. **Localization**: English only for launch. No i18n routing or translation dictionaries in v1.
8. **Public Privacy**: Unauthenticated users cannot search tutors, browse tutor catalogs, or view tutor profiles. Public pages provide conversion-focused marketing, curriculum subject listings, and platform information only.

---

## What Has Been Built

### Core Foundation & Authentication
- **Scaffold**: Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript 5.9, Mongoose 9.7.
- **Authentication**: Better Auth v1.6+ using native MongoDB adapter for `users` and `sessions` collections.
  - Supports Email/Password and Google OAuth sign-in.
  - **Strict Validation (`lib/validators/auth.ts`)**: Sign-up validation enforces full name rules (min 2 chars, letters/spaces/apostrophes/periods), email normalization (trimmed, lowercased), and strict password complexity (min 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char).
  - **Account-Only Signup**: Tutor sign-up creates the user account (`role: "tutor"`) and a draft `TutorProfile` shell document without collecting onboarding fields (headline, rate, bio) upfront, preparing the user for the dedicated onboarding flow.
  - Database hooks in `lib/auth.ts` handle user role assignments (`before`) and auto-creation of `TutorProfile` shell documents (`after`).
  - Configured `autoSignInAfterVerification: true` for email verification redirect flow.
  - **Development Email Verification**: Implemented modular `lib/email.ts` mailer service. In local development, `sendVerificationEmail` prints a formatted ASCII box with the exact verification link to the server terminal. Added dev-mode notice in `EmailVerificationPrompt` component.
- **Route Protection**: Next.js 16 `proxy.ts` root middleware checks the `better-auth.session_token` cookie to guard `/admin`, `/dashboard`, `/complete-profile`, and `/tutors`. Unauthenticated users are redirected to `/sign-in`.

### Tutor Onboarding Flow
- **Dedicated Onboarding (`app/complete-profile/page.tsx` & `components/tutors/tutor-onboarding-form.tsx`)**:
  - After tutor account creation, users are routed to `/complete-profile` (role-protected, `role === "tutor"`).
  - Collects a compressed profile photo plus core MVP fields: Professional Headline (10–120 chars), Short Bio (50–2000 chars), Hourly Rate ($1–$10,000 USD), Primary & Additional Subjects (reusing official `SUBJECTS` list from `lib/constants.ts`), optional intro video, and Weekly Teaching Availability.
  - Form components use theme-aware controls (`bg-card`, `text-foreground`, `[&>option]:bg-card [&>option]:text-foreground`) for legibility in both Light and Dark modes.
  - Saves profile data via `saveTutorProfile` and `saveAvailability`, then submits it via `submitTutorProfileForReview` before redirecting to the private tutor dashboard.

### Design System & Theme Engine
- **Visual Direction**: Warm editorial minimal aesthetic with custom OKLCH color tokens in `app/globals.css`.
- **Light & Dark Modes**:
  - Soft off-white light theme (`oklch(0.95 0.012 75)` background, `oklch(0.98 0.008 75)` cards) and eye-friendly dark theme.
  - `--color-white` mapped to `var(--theme-white)` so `bg-white` components seamlessly adapt to dark mode cards.
  - Hydration-safe inline head script in `app/layout.tsx` combined with `suppressHydrationWarning` on `<html>` to prevent theme flash and console warnings.
  - `<ThemeToggle />` component in `components/layout/theme-toggle.tsx` with `localStorage` persistence.

### Public Marketing Pages
- **Home (`app/page.tsx`)**: Hero headline "Master academic and professional skills.", value propositions, dynamic role-based CTA buttons, curriculum overview (tutor search bar removed for logged-out users).
- **Subjects We Teach (`app/subjects/page.tsx`)**: Standalone page with client-side category filters (Languages, School subjects, Programming, University subjects) and topic search. Prompts visitors to register for tutor access.
- **How It Works (`app/how-it-works/page.tsx`)**: Step-by-step guides for both Student and Tutor journeys.
- **About (`app/about/page.tsx`)**: Mission, vision, and core values (Quality Vetting, Fair Compensation, Transactional Freedom, Human Connection).
- **Become a Tutor (`app/become-a-tutor/page.tsx`)**: Tutor recruitment landing page detailing benefits, application process, and FAQs.

### Dashboard Base
- **Role-Aware Dashboards (`app/dashboard/`)**: Layout shell supporting `student`, `tutor`, and `admin` views, desktop sidebar (`sidebar.tsx`), mobile drawer header (`mobile-header.tsx`), and email verification banner (`verification-prompt.tsx`).

### Tutor Marketplace Workflow
- **Admin moderation (`/dashboard/admin/tutors`)**: Review queue inside the dashboard shell, gated by admin role with an email allowlist backdoor (`requireAdmin`). Presents only `pending_review` tutor applications with their photo, profile details, availability, and intro-video link. Approval and rejection are enforced again in server actions. The old `/admin` URL redirects here.
- **Tutor workspace**: Tutors have status-aware overview, profile/photo editor, availability, intro video, earnings/activity, and lesson-request pages.
- **Discovery and profiles**: Signed-in users can browse only approved profiles at `/tutors` and view `/tutors/[slug]`. Profiles include an expandable bio, availability summary, teaching rate, subjects, and an embedded YouTube/Vimeo introduction when available.
- **Lesson requests**: Students can submit one lightweight request per tutor while one is pending. Tutors accept or decline from their dashboard. The request model intentionally excludes messaging, payment, and classroom state until those workflows are introduced.
- **Booking & Scheduling**: Students book real slots directly from a tutor's profile. A timezone-correct slot engine (`lib/slots.ts`) expands the tutor's weekly availability into concrete UTC instants (30-minute grid, 1-hour minimum lead time, 14-day horizon), excluding already-booked intervals. The client slot picker renders times in the viewer's local timezone; the server re-validates every chosen slot before persisting. Both parties can cancel upcoming lessons; students see "My lessons", tutors see "My schedule" in their dashboards.
- **Payments (Stripe Checkout)**: Booking a slot creates a pending booking that holds the slot for 30 minutes and redirects the student to Stripe-hosted checkout. A signature-verified webhook (`/api/webhooks/stripe`) is the single source of truth: `checkout.session.completed` confirms the lesson, expired/failed sessions release the slot, refunds are reflected on both payment and booking records. Unpaid bookings can be paid later from My Bookings. Without Stripe keys configured, bookings confirm instantly (dev/demo mode).

---

## User Roles

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Student** | Browse approved tutors, submit lesson requests, and track tutor responses. |
| **Tutor** | Create a photo-backed profile, configure subjects, rate, intro video, and availability; respond to lesson requests. Requires admin approval before going public. |
| **Admin** | Allowlisted operations user who reviews pending tutor applications from the hidden `/admin` queue. |

---

## Strategic Build Roadmap

1. **Foundation & Setup** — Scaffold, Tailwind v4, DB connection, design tokens. *(Completed)*
2. **Authentication & Security** — Better Auth, Google OAuth, route proxy protection. *(Completed)*
3. **Public Marketing Experience** — Landing page, Subjects catalog, How It Works, About, Become a Tutor. *(Completed)*
4. **Tutor Onboarding & Admin Moderation** — Profile form, availability editor, private approval queue. *(Completed)*
5. **Discovery Marketplace** — Authenticated tutor directory, public profile pages, and lesson requests. *(Completed)*
6. **Booking & Scheduling** — Slot selection UI, timezone conversion, fixed lesson duration enforcement. *(Completed)*
7. **Stripe Payments Integration** — Card checkout via Stripe-hosted Checkout, payment ledger records, webhook reconciliation. *(Core completed; refunds UI & admin payout management remain)*
8. **Operations & Dashboards** — Tutor earnings view, student bookings dashboard, admin payout management.
9. **Local Pakistani Payments** — PayFast / bSecure wallet integration.
10. **In-App Messaging** — Booking-linked discussion threads.
11. **Live Lessons** — Agora WebRTC video room integration.
12. **Production Hardening** — Hostinger Node server deployment, PM2, domain & SSL configuration.
