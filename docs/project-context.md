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
- **Route Protection**: Next.js 16 `proxy.ts` root middleware checks the `better-auth.session_token` cookie to guard `/dashboard`, `/complete-profile`, and `/tutors`. Unauthenticated users are redirected to `/sign-in`.

### Tutor Onboarding Flow
- **Dedicated Onboarding (`app/complete-profile/page.tsx` & `components/tutors/tutor-onboarding-form.tsx`)**:
  - After tutor account creation, users are routed to `/complete-profile` (role-protected, `role === "tutor"`).
  - Collects core MVP profile fields: Professional Headline (10–120 chars), Short Bio (50–2000 chars), Hourly Rate ($1–$10,000 USD), Primary & Additional Subjects (reusing official `SUBJECTS` list from `lib/constants.ts`), and Weekly Teaching Availability.
  - Form components use theme-aware controls (`bg-card`, `text-foreground`, `[&>option]:bg-card [&>option]:text-foreground`) for legibility in both Light and Dark modes.
  - Saves profile data via `saveTutorProfile` and `saveAvailability` server actions, then redirects to `/dashboard`.

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

---

## User Roles

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Student** | Browse approved tutors, book single lessons, manage upcoming/past bookings, update student profile. |
| **Tutor** | Create draft profile, configure subjects, hourly rate (USD), intro video URL, and availability rules. View earnings ledger and upcoming bookings. Requires admin approval before going public. |
| **Admin** | Review pending tutor applications (approve/reject), manage manual tutor payouts ledger, oversee platform bookings and refund requests. |

---

## Strategic Build Roadmap

1. **Foundation & Setup** — Scaffold, Tailwind v4, DB connection, design tokens. *(Completed)*
2. **Authentication & Security** — Better Auth, Google OAuth, route proxy protection. *(Completed)*
3. **Public Marketing Experience** — Landing page, Subjects catalog, How It Works, About, Become a Tutor. *(Completed)*
4. **Tutor Onboarding & Admin Moderation** — Profile form, availability editor, admin approval queue. *(Next Focus)*
5. **Discovery Marketplace** — Authenticated tutor search, subject/language/price filtering, public profile pages.
6. **Booking & Scheduling** — Slot selection UI, timezone conversion, fixed lesson duration enforcement.
7. **Stripe Payments Integration** — Card checkout, payment ledger records, webhook reconciliation, refund request tracking.
8. **Operations & Dashboards** — Tutor earnings view, student bookings dashboard, admin payout management.
9. **Local Pakistani Payments** — PayFast / bSecure wallet integration.
10. **In-App Messaging** — Booking-linked discussion threads.
11. **Live Lessons** — Agora WebRTC video room integration.
12. **Production Hardening** — Hostinger Node server deployment, PM2, domain & SSL configuration.
