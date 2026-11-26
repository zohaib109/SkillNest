# SkillNest execution record

Updated November 26, 2026. Development takes place directly on `main`.

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
- Next build booking-linked messaging and review further operational needs. Safepay sandbox access is the next external payment dependency. Merchant onboarding, live payments, Agora credentials, final policies, safeguarding, and authorization for any production deployment are launch gates.
