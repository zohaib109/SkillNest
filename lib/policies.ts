/**
 * Temporary launch-policy defaults. These values are intentionally centralized
 * so product decisions can be changed without rewriting booking/payment logic.
 */
export const MARKETPLACE_POLICIES = {
	isMockConfiguration: true,
	platformCommissionBasisPoints: 1500,
	cancellation: {
		fullRefundHoursBeforeLesson: 24,
		partialRefundHoursBeforeLesson: 6,
		partialRefundPercent: 50,
	},
	noShow: {
		studentRefundPercent: 0,
		tutorNoShowRefundPercent: 100,
	},
	payout: {
		schedule: "weekly",
		minimumAmountMinor: 2500,
		currency: "USD",
		processingBusinessDays: 5,
	},
} as const;
