# Project Decisions Log

This document records the architectural, technical, and product decisions made for SkillNest, along with their rationales and constraints that future agent sessions must respect.

---

## Technical & Architectural Decisions

### 1. Next.js 16 Network Boundary Proxy (`proxy.ts`)
- **Decision**: Use `proxy.ts` at project root instead of `middleware.ts`.
- **Rationale**: Next.js 16 renames `middleware.ts` to `proxy.ts` as the standard request proxying convention before route handling.
- **Constraint**: Do not create or rename back to `middleware.ts`.

### 2. Dual Database Driver Pattern (Better Auth + Mongoose)
- **Decision**: Better Auth manages identity (`user`, `session`, `account`) via its native MongoDB driver (`better-auth/adapters/mongodb`). Mongoose handles application domain models (`TutorProfile`, `Booking`, etc.).
- **Rationale**: Keeps authentication fast and decoupled from application ODM schemas.
- **Constraint**: **NEVER wrap Better Auth `user` or `session` collections in Mongoose models.**

### 3. Session Cookie Naming with Underscores
- **Decision**: `proxy.ts` must check `better-auth.session_token` and `__Secure-better-auth.session_token` (using **underscores**, not hyphens).
- **Rationale**: Better Auth names its session cookies with underscores by default. Checking hyphenated cookie names in proxy middleware caused an infinite redirect loop between `proxy.ts` and `/sign-in`.
- **Constraint**: Maintain underscored cookie name checks in all session-aware middleware or proxies.

### 4. TypeScript 5.9 Version Lock for Launch
- **Decision**: Pin TypeScript to 5.9.x for v1; defer TypeScript 7 upgrade.
- **Rationale**: Next.js 16 still requires experimental flags for TypeScript 7 build checking. TypeScript 5.9 guarantees stable production builds.
- **Constraint**: Do not upgrade to TS 7 until Next.js supports it without experimental flags.

### 5. Tailwind CSS v4 Variable Mapping for Dark Mode (`--theme-white`)
- **Decision**: Map `@theme inline { --color-white: var(--theme-white); }` in `app/globals.css`. `--theme-white` is mapped to `#ffffff` in `:root` and `var(--card)` in `.dark`.
- **Rationale**: Allows components using standard Tailwind `bg-white` classes to scale seamlessly to dark mode card backgrounds without editing dozens of files.
- **Constraint**: Preserve the `--theme-white` mapping when adding new UI components.

### 6. Hydration-Safe Theme System
- **Decision**: Use `suppressHydrationWarning` on `<html>` in `app/layout.tsx` alongside an inline `<head>` script that reads `localStorage.theme` and sets the `.dark` class before initial paint.
- **Rationale**: Prevents a light-mode "flash" on initial load while adhering to React/Next.js guidelines for client-side class attribute modifications on `<html>`.
- **Constraint**: Keep `suppressHydrationWarning` on `<html>`.

### 7. Dependency Audit & Icon/Style Strategy
- **Decision**: Remove unused `@hugeicons` packages and unused `@import "shadcn/tailwind.css"` from `globals.css`. Rely on standalone `globals.css` OKLCH tokens and clean inline SVG components for icons.
- **Rationale**: Avoids unnecessary package dependencies, lockfile bloat, and CSS import resolution errors while keeping the design tokens self-contained in `globals.css`.
- **Constraint**: Prefer clean inline SVGs or standard SVG component icons. Keep design tokens defined directly in `globals.css`.

---

## Product & Business Model Decisions

### 1. Single Paid Lessons Transaction Model
- **Decision**: Students book individual single lessons in v1. No subscriptions or bulk lesson packages.
- **Rationale**: Lowers student friction, eliminates lock-in anxiety, and simplifies checkout and refund management.

### 2. Pakistan-First Tutors, Global Students
- **Decision**: Tutor onboarding and operations focus on Pakistan; student marketing targets global learners.
- **Rationale**: Leverages high-quality, cost-competitive tutoring supply in Pakistan to serve international demand.

### 3. Manual Admin Tutor Payouts
- **Decision**: Tutors accrue earnings in an internal balance ledger. Admins manually process payouts to tutor bank accounts.
- **Rationale**: Avoids the operational overhead and regulatory complexity of global automated payout systems (e.g., Stripe Connect) for launch.

### 4. Manual Admin-Reviewed Refunds
- **Decision**: Refund requests are submitted to an admin queue for manual review.
- **Rationale**: Prevents fraudulent chargebacks and platform abuse without needing automated instant-refund logic in v1.

### 5. Mandatory Admin Approval for Tutor Profiles
- **Decision**: Tutor profiles start in `draft` status upon registration. Tutors cannot appear in public/authenticated search or take bookings until an admin sets `isApproved: true` and `status: "approved"`.
- **Rationale**: Maintains marketplace quality control and prevents unverified or spam profiles from appearing publicly.

### 6. YouTube / Vimeo Embeds for Intro Videos
- **Decision**: Tutor intro videos require a YouTube or Vimeo URL.
- **Rationale**: Eliminates costly video uploading, transcoding, storage, and streaming infrastructure for launch.

### 7. UTC Timestamp Storage
- **Decision**: Store all datetime fields in UTC in MongoDB. UI handles timezone conversion to the user's local timezone.
- **Rationale**: Eliminates scheduling ambiguity between global students and Pakistani tutors.

### 8. English Only at Launch
- **Decision**: Launch scope is strictly English. No i18n routing or translation files in v1.
- **Rationale**: Prevents premature scope creep.

### 9. Logged-Out Tutor Privacy & Browsing Restrictions
- **Decision**: Unauthenticated users cannot search tutors, browse tutor lists, or open tutor profiles. Public routes display marketing, subjects catalog, process guides, and recruitment content only.
- **Rationale**: Protects tutor privacy, encourages student sign-ups, and keeps public routes focused on conversion.

### 10. Decoupled Post-Signup Tutor Onboarding Flow
- **Decision**: Tutor signup creates the user account and a draft profile shell. The tutor completes the profile and weekly availability through `/complete-profile` or the dashboard before submitting for review.
- **Rationale**: Keeps account registration simple and fast while ensuring tutors complete a structured onboarding flow before submitting their profile for approval.

### 11. Default Next.js Development Compiler
- **Decision**: Use `next dev` without forcing a compiler in `package.json`.
- **Rationale**: The default compiler provides substantially faster local feedback for this project.
- **Constraint**: Do not add `--webpack` to any application run script. Treat compiler-specific failures as targeted troubleshooting rather than a permanent project-wide fallback.

### 12. Trusted OAuth Account Linking in Better Auth
- **Decision**: Enable `account.accountLinking: { enabled: true, trustedProviders: ["google"] }` in `lib/auth.ts`.
- **Rationale**: Allows users who previously registered via email/password to seamlessly sign in with Google OAuth using the same verified email address without triggering `account_not_linked` errors or duplicating accounts.

### 13. Server-Owned Admin Role
- **Decision**: Public signup may create only `student` or `tutor` accounts. The Better Auth `role` field uses `input: false`, and the server resolves the allowed self-service role from a constrained registration cookie.
- **Rationale**: Prevents a caller from submitting `role: "admin"` directly to the auth endpoint.
- **Constraint**: Admins must be provisioned through a controlled operational procedure; never expose admin selection in public registration.

### 14. Canonical Tutor Review State
- **Decision**: Tutor status values are `draft | pending_review | approved | rejected` everywhere.
- **Rationale**: A previous `pending` versus `pending_review` mismatch broke TypeScript checks and hid submitted tutors from the admin review queue.
- **Constraint**: Approval and rejection are valid only from `pending_review`, and discovery requires both `status: "approved"` and `isApproved: true`.

### 15. Moderated Profile Edits
- **Decision**: Saving changes to an approved or pending-review tutor profile returns the profile to `draft` and clears approval metadata.
- **Rationale**: Prevents unreviewed public content from remaining bookable under an earlier approval.
- **Future Option**: Add separate draft and published profile versions so an approved version can remain live during re-review.

### 16. First Launch Includes Messaging and Agora
- **Decision**: Booking-linked messaging and Agora browser lessons are required before the first public launch.
- **Rationale**: The launch product must support the complete student-tutor lesson lifecycle, not only discovery and checkout.

### 17. Pakistan Business and Flexible Infrastructure
- **Decision**: SkillNest is registered in Islamabad with a Pakistan-based business bank account. Hosting is not locked to Hostinger.
- **Rationale**: Payment gateway and deployment choices must work for a Pakistan contracting entity while serving international students.
- **Constraint**: Do not lock a payment gateway until its Pakistan merchant onboarding, international card acceptance, settlement, webhook, refund, and compliance fit have been verified.

### 18. Temporary Marketplace Policies
- **Decision**: Commission, cancellation, no-show, refund, and payout settings are mock values centralized in `lib/policies.ts`.
- **Current Mock Values**:
  - Platform commission: 15% (`1500` basis points).
  - Full-refund cancellation window: at least 24 hours before the lesson.
  - Partial refund: 50% from 6 to 24 hours before the lesson.
  - Late student cancellation/no-show: 0% refund by default, subject to admin review.
  - Tutor no-show: 100% refund.
  - Tutor payouts: weekly, USD 25 mock minimum, up to five business days processing.
- **Constraint**: UI and transaction records must label these values as policy snapshots/configuration rather than hard-coding them across features.

### 19. Test Data and Deferred Document Verification
- **Decision (updated September 17, 2026)**: The user reports an Azure testing deployment, superseding the assumption that all records are disposable. Tutor identity documents, degrees, certificates, and background checks remain deferred.
- **Constraint**: Verify database isolation and authorization before resets or migrations. Initial moderation continues to focus on profile quality.

### 20. Conservative Modernization Baseline (August 15, 2026)
- **Decision**: Keep the existing App Router, Better Auth, MongoDB/Mongoose, Tailwind, and server-action architecture; modernize in place rather than rewrite it.
- **Security Update (November 25, 2026)**: Use the approved Next.js 16.4.6, Better Auth 1.7.7, Mongoose 9.11.4, and Vitest 4.1.12 releases. The lockfile records the resolved versions and targeted transitive fixes.
- **Runtime Floor (November 25, 2026)**: Require Node.js 22.13 or newer for pinned pnpm 11.19.0.
- **Auth Configuration**: Validate server-only environment variables, require a 32-character minimum Better Auth secret, keep `BETTER_AUTH_URL` server-side, and use Better Auth's same-origin browser client default.
- **Moderation Invariant**: Any tutor-owned edit to moderated profile content, including weekly availability, returns the profile to `draft` and clears approval metadata.
- **Package Management**: pnpm remains the only package manager; the accidentally committed Bun lockfile was removed.

### 21. Temporary Manual Collection Accounts
- **Decision**: Load the supplied PKR, USD, and GBP reference from the optional server runtime setting `PAYMENT_RECEIVING_ACCOUNTS` and show it on the role-protected admin payments page.
- **Rationale**: Admins need a temporary operational reference before the booking-linked gateway and ledger are complete, without publishing financial details to logged-out visitors or every account holder.
- **Constraint**: A transfer must never confirm a booking automatically. An admin must verify the amount, currency, sender, and booking reference. Replace this temporary setup with booking-scoped instructions and ledger-backed reconciliation during Milestone 3.

### 22. Development Branch and Database Isolation

- Develop on `main`. `feature/testing` is the Azure deployment branch and targets the App Service Production slot.
- Use an explicit database in `MONGODB_URI` and a separately supplied `SMOKE_MONGODB_URI` for integration tests. Prefer a local replica set for disposable work.

### 23. Booking Calendar Defaults

- Use 12 hours' notice, a 30-day booking window, and a zero-minute break until the tutor chooses other settings. A checkout hold uses a 10-minute window, which is also the lowest effective notice.
- Generate starts at 15-minute increments from each weekly block's start time. Honor full-day closures in the tutor's timezone. Omit lessons that span a wall-clock change and distinguish the two real instants for a repeated start time.
- Changes to private booking settings apply to future holds. Weekly hours remain part of the moderated profile.

### 24. Booking Hold Transactions

- Serialize reservation creation on both participant documents. The tutor profile write also orders reservation creation against approval, schedule, and rate changes. Store each hold and subsequent lesson states together in `Booking`. Use the hold deadline to free unpaid availability and retain the original record for audit and late-payment reconciliation.
- Recompute the price and candidate at submission. Store the quoted currency and prorated integer minor-unit amount. Existing hourly rates are first rounded to whole minor units. Reject stale quotes before creating a booking.
