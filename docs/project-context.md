# SkillNest project context

SkillNest connects international adult university students to Pakistan-based tutors for individual lessons. The initial recruitment focus is introductory Python. A learner brings one problem and leaves with a way to test their understanding independently. The first adjacent subject to validate is university maths. English is the launch language.

The [pilot specification](pilot-spec.md) owns product behavior, the student and tutor journeys, design direction, validation plan and commercial proposals. The [roadmap](roadmap.md) owns sequencing and acceptance. The [execution record](execution.md) records actual verification. Use the [cost register](operating-costs.md) before choosing a provider.

## Known working foundation

Better Auth owns identity and sessions. Student, tutor and admin roles are enforced server-side. Tutor onboarding includes a moderated profile, rates, durations and timezone-aware weekly availability. Verified students can save approved tutors. Reservations prevent overlapping holds for either participant and retain the original price in minor currency units. Local sandbox captures create auditable ledger entries. Students can cancel a future confirmed sandbox lesson, admins can review refunds and tutors can see lesson history. Production mail, Google callback acceptance, Atlas TLS, real payments, payouts and classroom delivery need further verification or external access.

## Pilot workflows

Guests can inspect opted-in public profiles, lesson totals and available times. Confirmed participants have private booking messages and a lesson room with check-in, local device preview and incident reporting. Tutors can leave a recap and a practice problem for the student to try independently. Students can see their sandbox payment receipts. Tutors can inspect refund-adjusted sandbox earnings by currency.

## Launch conditions

The business is registered in Islamabad and expects Pakistani bank settlement. Choose an international card provider only after marketplace and settlement eligibility are confirmed. Keep previous tutors visible to their existing audience and require explicit publication consent for guest discovery. Profile approval means content review. Preserve the Azure standalone deployment contract, develop on main, and leave deployment under separate authorization. The pilot is adult-focused. Final eligibility, refund, commission, evidence retention and payout terms require owner approval.
