# SkillNest execution record

Updated November 26, 2026. Development takes place directly on `main`.

## Baseline

- The preceding foundation checkpoint was `74290af`. It verified auth and tutor discovery against a local MongoDB replica set.
- Atlas resolves three SRV records, but a read-only driver ping fails with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`. Hosted Google OAuth remains open. Production mail delivery requires a provider.
- GitHub's workflow inventory showed only the Azure workflow, which gates its build and deploy chain to `feature/testing`. The repository webhook list was empty when checked before the booking checkpoint.
- Earlier public history contains financial information. Coordinate removal or replacement of any exposed operational details with the owner. A history rewrite requires separate authorization.

## Current work

- Milestone 2 implements UTC slot generation, tutor booking settings, atomic unpaid holds, and student viewing and release. The isolated MongoDB 8.0.20 smoke suite passed overlapping tutor and student races, expiry, buffer overlap and ownership checks. Unit tests cover daylight saving transitions. Lint, type generation, type checking, 24 unit tests, and the default Turbopack build invoked directly from system Node passed. The bundled pnpm build initially failed to connect to its PostCSS worker. Browser acceptance is open.
- The next checkpoint is payment state and ledger work, starting with isolated sandbox events. Merchant onboarding, live payments, Agora credentials, final policies, safeguarding, and authorization for any production deployment are launch gates.
