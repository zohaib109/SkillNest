import { CURRENCIES } from "@/lib/constants";

export function lessonQuote(
	hourlyRate: number,
	currency: string,
	duration: number,
) {
	if (
		!Number.isFinite(hourlyRate) ||
		hourlyRate < 1 ||
		hourlyRate > 10_000 ||
		!CURRENCIES.some(({ code }) => code === currency)
	)
		return null;
	// All supported currencies have two minor digits. Round the prorated
	// lesson once from a whole minor-unit hourly price.
	return {
		amountMinor: Math.round((Math.round(hourlyRate * 100) * duration) / 60),
		currency,
	};
}

export function formatLessonPrice(amountMinor: number, currency: string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		currencyDisplay: "code",
	}).format(amountMinor / 100);
}
