import { MARKETPLACE_POLICIES } from "@/lib/policies";

const HOUR_MS = 3_600_000;

export function estimateStudentRefund(
	amountMinor: number,
	startsAt: Date,
	requestedAt: Date,
) {
	const policy = MARKETPLACE_POLICIES.cancellation;
	const notice = startsAt.getTime() - requestedAt.getTime();
	const percent =
		notice >= policy.fullRefundHoursBeforeLesson * HOUR_MS
			? 100
			: notice >= policy.partialRefundHoursBeforeLesson * HOUR_MS
				? policy.partialRefundPercent
				: MARKETPLACE_POLICIES.noShow.studentRefundPercent;
	return {
		policyPercent: percent,
		amountMinor: Math.round((amountMinor * percent) / 100),
	};
}
