# SkillNest execution record

Updated November 27, 2026. Development takes place directly on `main`.

## Baseline

- The preceding foundation checkpoint was `74290af`. It verified auth and tutor discovery against a local MongoDB replica set.
- Atlas resolves three SRV records, but a read-only driver ping fails with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`. Hosted Google OAuth remains open. Production mail delivery requires a provider.
- GitHub's workflow inventory showed only the Azure workflow, which gates its build and deploy chain to `feature/testing`. The repository webhook list was empty when checked before the booking checkpoint.
- Earlier public history contains financial information. Coordinate removal or replacement of any exposed operational details with the owner. A history rewrite requires separate authorization.

## Current work

- Milestone 2 is in `6e36579`, verified on GitHub `main`. The isolated MongoDB 8.0.20 smoke suite passed overlapping tutor and student races, expiry, buffer overlap and ownership checks. Unit tests cover daylight saving transitions.
- The sandbox payment foundation is in `a8e6bc3`, verified on GitHub `main`. It supports opt-in local sandbox confirmation, signed events, audit outcomes, and commission and pending earnings entries. Three isolated MongoDB smoke tests passed, including duplicate capture, invalid signature, incorrect amount, and late capture with the slot already reassigned.
- A headless Edge journey passed on desktop in New York time and at a mobile dark-mode viewport in Karachi time. It covered logged-out redirects, email signup and verification, approved tutor discovery, slot selection, hold and release, sandbox checkout, and ledger creation. The journey captured no browser exceptions or server errors.
- Admins can inspect recent bookings and sandbox anomalies and decide cancellation refunds. Student cancellations release confirmed sandbox slots immediately. Review decisions, payment state, and reversal entries are recorded atomically. The isolated MongoDB smoke suite passed cross-account rejection, concurrent admin decisions, balanced reversal totals, and slot reuse.
- Safepay sandbox access is the next external payment dependency. Merchant onboarding, live payments, Agora credentials, final policies, safeguarding, and authorization for any production deployment are launch gates.

## Adult Python pilot

- Owner consultation is complete. The product specification, cost register and roadmap are in `14fc13c`. The earlier sandbox refund checkpoint is `e90b787`. The verified opt-in public discovery checkpoint is `37146a6`. GitHub main was verified after the push.
- Edge accepted public exploration, a duration change and its exact total, local time display, a private profile returning the not-found UI, and a sign-in callback retaining duration on 1280px and 390px viewports. Legacy approved profiles are student-only by default.
- Learning goals, tutor-attested recaps, practice responses and same-tutor carry-forward are implemented locally. The isolated MongoDB suite passed four workflows, including concurrency, access boundaries, sandbox settlement, and learning-note retries. Separate tutor and student Edge sessions exercised publishing a recap, reporting an independent attempt and carrying that exercise into a new held booking. The elapsed confirmed lesson was a synthetic fixture. A live classroom and independent assessment of learning efficacy are outstanding.
- Verification used isolated local data and synthetic credentials. A paid provider, card enrollment, hosted operation or deployment requires separate approval.
- The learning workflow was committed as `08f088f`. Booking-linked messaging now has bounded text, participant-only access, unread state, older pages, retry-safe sends, closed threads and an admin queue limited to reported excerpts. Five isolated MongoDB workflows passed. Edge verified a student sending a message, a tutor seeing the unread indicator and reporting that message, and an admin recording the decision. Lint, typecheck, 27 unit tests and production build passed. A fresh read-only Atlas ping still failed TLS with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`.
- Lesson check-in, an on-device camera/microphone preview, private participant statements, and a revision-guarded staff support queue are implemented. Six isolated database workflows passed. Edge confirmed check-in, synthetic device preview and track release, the privacy of a student statement, staff review and the shared outcome. Lint, typecheck, 27 unit tests and production build passed. The check-in is a participant action. Actual two-party media and provider-attested connection events remain open.
- The lesson room and support checkpoint is `5592fa1`. Student bookings now link to a reconciled sandbox receipt. Tutors can open Earnings to inspect payments, refunds, platform fees and pending balances by currency. Edge verified a USD 10.00 lesson with a USD 5.00 refund, a USD 4.25 pending tutor balance, and denial of the receipt to a different signed-in student. Database coverage includes mixed currencies and full reversals. Lint, typecheck, 27 unit tests, six isolated MongoDB workflows and the production build passed.
- Receipts and earnings reached GitHub main at `ed21cc8`. A verified admin can now simulate a full return for a late payment against a lost hold. Independent student and staff Edge sessions exercised the pending notice, return, audit history and updated student notice. Another student saw no transaction. The MongoDB suite covered simultaneous staff retries after slot reassignment, rejection of a mismatched event and zero tutor or commission credits. Lint, typecheck, 27 unit tests, six database workflows and the production build passed.
- Next remove unnecessary profile re-review when a tutor changes only weekly hours. External RTC credentials, hosted TLS, real settlement and commercial approvals remain launch gates.
