# SkillNest Development Roadmap

**Last updated:** August 15, 2026
**Current milestone:** Foundation stabilization integration smoke, followed by authenticated tutor discovery

This file is the authoritative implementation order for future development sessions. Read it together with `project-context.md`, `architecture.md`, and `decisions.md` before making changes.

## Confirmed Launch Direction

- SkillNest is a Pakistan-registered tutoring marketplace headquartered in Islamabad.
- The business bank account will be in Pakistan; students may purchase lessons internationally.
- All current MongoDB data is disposable test data. The application has never been deployed.
- The first public launch must include paid single-lesson booking, booking-linked messaging, and Agora browser video lessons.
- Tutor identity documents, degrees, certificates, and background checks are not required yet.
- Hosting is not locked to Hostinger. Select infrastructure based on security, reliability, webhook support, and operational cost.
- Commission, cancellation, no-show, refund, and payout values are temporary mock policy values until the business finalizes them.

## Delivery Principles

1. Secure invariants before adding marketplace surface area.
2. Build complete vertical flows rather than disconnected screens.
3. Keep authorization and financial decisions server-side.
4. Store datetimes in UTC and money in integer minor units.
5. Treat payment webhooks and financial ledgers as the source of truth.
6. Keep `docs/` updated in the same change as material architecture or product work.
7. Every milestone must pass formatting, lint, TypeScript, and relevant automated tests.

## Milestone 0 — Foundation Stabilization

**Status:** Implemented in code; MongoDB-backed end-to-end smoke testing remains

Scope:

- Prevent self-service admin role creation.
- Validate email signup on the server and constrain auth callbacks to internal routes.
- Use one tutor status vocabulary: `draft | pending_review | approved | rejected`.
- Consolidate tutor editing and make review submission functional.
- Preserve the `status === approved && isApproved === true` discovery invariant.
- Require valid, non-overlapping availability before tutor submission.
- Centralize temporary business policies.
- Add type-check and automated-test commands.
- Make Biome, TypeScript, and tests pass cleanly.
- Enforce validated server configuration and apply the current Next.js security patch.
- Keep moderation invalidation consistent across tutor profile and availability edits.
- Keep a cleanup-safe `pnpm test:smoke` harness for the live auth and moderation invariants.
- Replace scaffold documentation with repository-specific instructions.

Exit criteria:

- Public registration cannot create an admin.
- A tutor can save, submit, be approved/rejected, and resubmit.
- Only a pending-review profile can be approved or rejected.
- Editing approved content requires a fresh moderation pass.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass.

## Milestone 1 — Authenticated Tutor Discovery

**Status:** Implemented in code; MongoDB-backed integration and browser UX smoke remain

Scope:

- Add approved-tutor-only data access with indexed queries.
- Build authenticated `/tutors` discovery with URL-backed filters.
- Add `/tutors/[slug]` profiles with subjects, languages, rates, duration, video, rating summary, and availability preview.
- Add search, sort, pagination, empty/loading states, and saved tutors.
- Keep tutor catalogs and profiles inaccessible to logged-out visitors.

Exit criteria: a verified student can find and evaluate approved tutors, and no draft/rejected tutor can leak through any query.

## Milestone 2 — Scheduling and Booking Holds

Scope:

- Add availability exceptions, time off, minimum notice, booking horizon, and buffers.
- Generate timezone-safe slots from tutor rules.
- Create `Booking` and temporary `BookingHold` models.
- Enforce duration selection and overlap prevention atomically in MongoDB.
- Store UTC timestamps plus the student/tutor timezone snapshots used at booking.

Exit criteria: concurrent students cannot reserve overlapping tutor time, and expired unpaid holds release safely.

## Milestone 3 — Payments and Financial Ledger

Scope:

- Evaluate gateways that can contract with a Pakistan-registered business and accept international cards.
- Store monetary values in minor units and snapshot price/fee terms on each booking.
- Add payment initiation, signed webhook/callback handling, idempotency, and reconciliation.
- Confirm bookings only from verified payment events.
- Add append-only commission, tutor earning, refund, and payout ledger entries.
- Implement admin-reviewed refund requests using centralized policy configuration.

Exit criteria: every payment state transition is auditable and replay-safe; failed payments never confirm bookings.

## Milestone 4 — Operational Dashboards and Notifications

Scope:

- Student upcoming/past lessons, cancellations, refunds, and receipts.
- Tutor calendar, lesson history, earnings, and payout requests.
- Admin booking, dispute, refund, and manual payout operations.
- Production transactional email, reminder scheduling, and calendar attachments.

Exit criteria: SkillNest staff can operate bookings and money without direct database edits.

## Milestone 5 — Booking-Linked Messaging

Scope:

- Create conversation and message models scoped to a booking.
- Enforce participant-only access.
- Add unread state, pagination, content limits, moderation/reporting, and notifications.
- Begin with reliable polling or server-driven refresh; add sockets only when justified.

Exit criteria: student and tutor can coordinate within a booking, while unrelated users and tutors cannot access the thread.

## Milestone 6 — Agora Live Lessons

Scope:

- Issue short-lived Agora tokens only to booking participants.
- Enforce join windows and booking status.
- Add pre-call device checks, camera/mic controls, screen sharing, reconnect handling, and attendance events.
- Test two-user calls across browsers and constrained networks.

Exit criteria: only valid participants can enter the correct lesson during the allowed window.

## Milestone 7 — Reviews, Trust, and Safety

Scope:

- Permit one verified review per completed booking.
- Maintain rating aggregates safely.
- Add reporting, account suspension, admin audit history, and basic abuse controls.
- Introduce document-based tutor verification only when the business explicitly enables it.

## Milestone 8 — Production Hardening and Launch

Scope:

- End-to-end tests for auth, moderation, discovery, booking, payments, messaging, and lessons.
- Rate limiting, CSP/security headers, secrets management, structured logs, monitoring, and backups.
- Terms, privacy, tutor agreement, cancellation/refund policy, and financial disclosures.
- Choose and configure deployment, domain, SSL, MongoDB Atlas, email, gateway callbacks, and Agora credentials.
- Run accessibility, responsive, timezone, concurrency, and payment-reconciliation testing.

Exit criteria: production launch checklist is complete and the full critical-path test suite passes.

## Post-Launch Candidates

- Personalized tutor ranking and recommendations.
- Coupons, referrals, gift lessons, packages, or subscriptions.
- Learning plans, progress tracking, and tutor analytics.
- Additional currencies and local payment methods.
- PWA/mobile applications and localization.
