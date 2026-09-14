import "server-only";

/**
 * Temporary manual collection accounts.
 *
 * Keep this module server-only and restrict every consumer to administrators
 * until booking-scoped payment instructions and reconciliation exist.
 */
export const TEMPORARY_PAYMENT_INSTRUCTIONS = {
	local: {
		currency: "PKR",
		method: "Bank transfer",
		bankName: "Bank Al-Habib",
		branch: "220-ASKARI 14",
		accountTitle: "ABDUL HAFEEZ",
		accountNumber: "02200981001489014",
		iban: "PK23BAHL0220098100148901",
	},
	international: [
		{
			currency: "USD",
			label: "XX-1655",
			provider: "Payoneer",
			region: "Based in USA",
			accountLabel: "USD Account 1",
			bankName: "First Century Bank",
			bankAddress: "1731 N Elm St, Commerce, GA 30529, USA",
			routingLabel: "Routing (ABA)",
			routingNumber: "061120084",
			accountNumber: "4026613111655",
			accountType: "CHECKING",
			beneficiaryName: "Abdul Hafeez",
		},
		{
			currency: "GBP",
			label: "XX-0978",
			provider: "Payoneer",
			region: "Based in UK",
			accountLabel: "GBP Account 1",
			bankName: "Barclays",
			routingLabel: "Sort code",
			routingNumber: "231486",
			accountNumber: "07970978",
			beneficiaryName: "Abdul Hafeez",
		},
	],
	contactPhone: "+923359966282",
} as const;
