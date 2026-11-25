import "server-only";

import { z } from "zod/v4";

const field = z.string().trim().min(1);
const instructionsSchema = z.object({
	local: z.object({
		currency: z.literal("PKR"),
		method: field,
		bankName: field,
		branch: field,
		accountTitle: field,
		accountNumber: field,
		iban: field,
	}),
	international: z.array(
		z.object({
			currency: z.enum(["USD", "GBP"]),
			label: field,
			provider: field,
			region: field,
			accountLabel: field,
			bankName: field,
			bankAddress: field.optional(),
			routingLabel: field,
			routingNumber: field,
			accountNumber: field,
			accountType: field.optional(),
			beneficiaryName: field,
		}),
	),
	contactPhone: field,
});

export type PaymentInstructions = z.infer<typeof instructionsSchema>;

export function getPaymentInstructions(): PaymentInstructions | null {
	const configured = process.env.PAYMENT_RECEIVING_ACCOUNTS;
	if (!configured) return null;

	try {
		const parsed = instructionsSchema.safeParse(JSON.parse(configured));
		if (parsed.success) return parsed.data;
	} catch {
		// Treat malformed JSON the same as invalid fields without logging values.
	}

	console.error("PAYMENT_RECEIVING_ACCOUNTS has an invalid format.");
	return null;
}
