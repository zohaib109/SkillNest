import { describe, expect, it } from "vitest";
import { hasOverlappingAvailabilityRules } from "@/lib/availability";
import { availabilitySchema } from "@/lib/validators/tutor";

describe("availability validation", () => {
	it("allows adjacent slots", () => {
		const rules = [
			{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
			{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
		];

		expect(hasOverlappingAvailabilityRules(rules)).toBe(false);
		expect(availabilitySchema.safeParse({ rules }).success).toBe(true);
	});

	it("rejects overlapping slots on the same day", () => {
		const rules = [
			{ dayOfWeek: 2, startTime: "09:00", endTime: "11:00" },
			{ dayOfWeek: 2, startTime: "10:30", endTime: "12:00" },
		];

		expect(hasOverlappingAvailabilityRules(rules)).toBe(true);
		expect(availabilitySchema.safeParse({ rules }).success).toBe(false);
	});

	it("allows matching times on different days", () => {
		expect(
			hasOverlappingAvailabilityRules([
				{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" },
				{ dayOfWeek: 2, startTime: "09:00", endTime: "11:00" },
			]),
		).toBe(false);
	});
});
