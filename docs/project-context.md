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

## Confirmed Business & Launch Context

- SkillNest is registered in Islamabad, Pakistan, and its business bank account will be located in Pakistan.
- Students are international; the tutor supply launch remains Pakistan-first.
- The application has never been deployed. All existing MongoDB records are test data and may be reset or migrated during development.
- Booking-linked messaging and Agora browser video lessons are required for the first public launch.
- Tutor document, credential, and background verification is deferred; initial moderation reviews profile quality only.
- Deployment is flexible and will be selected during production hardening rather than being locked to Hostinger.
- Commercial policy values remain temporary mocks. The current centralized defaults live in `lib/policies.ts`.

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
- **Authentication Hardening (August 2026)**:
  - Public registration can create only `student` or `tutor` accounts; `admin` is server-owned and must be provisioned operationally.
  - Email signup validation is enforced inside Better Auth on the server, not only in the client form.
  - Authentication callback URLs are constrained to internal SkillNest paths.

### Tutor Onboarding Flow
- **Dedicated Onboarding (`app/complete-profile/page.tsx`, `TutorProfileForm`, and `AvailabilityEditor`)**:
  - After tutor account creation, users are routed to `/complete-profile` (role-protected, `role === "tutor"`).
  - Collects headline, bio, rate/currency, subjects, languages, lesson durations, country/timezone, optional intro video, and weekly availability.
  - Form components use theme-aware controls (`bg-card`, `text-foreground`, `[&>option]:bg-card [&>option]:text-foreground`) for legibility in both Light and Dark modes.
  - Saves profile and availability through separate server actions and explicitly submits the complete profile for admin review.
- **Moderation Integrity (August 2026)**:
  - The canonical status vocabulary is `draft | pending_review | approved | rejected`.
  - Profile and availability editing use one full tutor profile editor plus the dedicated availability editor.
  - Submission requires at least one valid, non-overlapping availability slot.
  - Admin approval and rejection use atomic status-guarded updates.
  - Editing approved or pending-review content returns it to draft and removes approval until a new review succeeds.

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

The authoritative, acceptance-criteria-driven implementation order is maintained in `docs/roadmap.md`.

Current sequence:

1. Foundation stabilization and tutor moderation integrity.
2. Authenticated tutor discovery.
3. Scheduling and atomic booking holds.
4. Pakistan-compatible international payments and append-only financial ledger.
5. Operational dashboards and notifications.
6. Booking-linked messaging.
7. Agora live lessons.
8. Reviews, trust, and safety.
9. Production hardening and public launch.
