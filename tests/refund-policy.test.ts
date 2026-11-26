import { describe, expect, it } from "vitest";
import { estimateStudentRefund } from "@/lib/refund-policy";

describe("mock cancellation policy", () => {
	const lesson = new Date("2026-11-27T18:00:00.000Z");
	it("uses inclusive notice boundaries and rounds partial prices to minor units", () => {
		expect(
			estimateStudentRefund(2501, lesson, new Date("2026-11-26T18:00:00.000Z")),
		).toEqual({ policyPercent: 100, amountMinor: 2501 });
		expect(
			estimateStudentRefund(2501, lesson, new Date("2026-11-26T18:00:00.001Z")),
		).toEqual({ policyPercent: 50, amountMinor: 1251 });
		expect(
			estimateStudentRefund(2501, lesson, new Date("2026-11-27T12:00:00.000Z")),
		).toEqual({ policyPercent: 50, amountMinor: 1251 });
		expect(
			estimateStudentRefund(2501, lesson, new Date("2026-11-27T12:00:00.001Z")),
		).toEqual({ policyPercent: 0, amountMinor: 0 });
	});
});
