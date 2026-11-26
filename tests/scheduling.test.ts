import { describe, expect, it } from "vitest";
import { findLessonSlots, withSchedulingDefaults } from "@/lib/scheduling";
import type { AvailabilityRule } from "@/lib/types";
import { schedulingSettingsSchema } from "@/lib/validators/tutor";

function schedule(timezone: string, rules: AvailabilityRule[]) {
	return {
		timezone,
		lessonDurations: [30, 60],
		availabilityRules: rules,
		scheduling: withSchedulingDefaults({ minimumNoticeHours: 0 }),
	};
}

const rule = (startTime: string, endTime: string, dayOfWeek = 0) => ({
	dayOfWeek,
	startTime,
	endTime,
});

describe("lesson slots", () => {
	it("resolves local dates and non-hour offsets while preserving the weekly rule's start grid", () => {
		const now = new Date("2026-11-21T16:00:00Z");
		const options = schedule("Asia/Kathmandu", [rule("00:05", "01:05")]);
		const slots = findLessonSlots(
			options,
			30,
			now,
			now,
			new Date("2026-11-22T00:00:00Z"),
		);
		expect(slots.map(({ start }) => start.toISOString())).toEqual([
			"2026-11-21T18:20:00.000Z",
			"2026-11-21T18:35:00.000Z",
			"2026-11-21T18:50:00.000Z",
		]);
		options.scheduling.timeOffDates = ["2026-11-22"];
		expect(
			findLessonSlots(options, 30, now, now, new Date("2026-11-22T00:00:00Z")),
		).toEqual([]);
	});

	it("skips nonexistent times and lessons across the spring clock change", () => {
		const now = new Date("2026-03-08T04:00:00Z");
		const options = schedule("America/New_York", [rule("01:30", "04:00")]);
		const slots = findLessonSlots(
			options,
			60,
			now,
			now,
			new Date("2026-03-09T00:00:00Z"),
		);
		expect(slots.map(({ start }) => start.toISOString())).toEqual([
			"2026-03-08T07:00:00.000Z",
		]);
	});

	it("distinguishes the two occurrences of a repeated local time", () => {
		const now = new Date("2026-11-01T03:00:00Z");
		const options = schedule("America/New_York", [rule("01:00", "02:00")]);
		const slots = findLessonSlots(
			options,
			30,
			now,
			now,
			new Date("2026-11-02T00:00:00Z"),
		);
		expect(slots.map(({ start }) => start.toISOString())).toEqual([
			"2026-11-01T05:00:00.000Z",
			"2026-11-01T05:15:00.000Z",
			"2026-11-01T06:00:00.000Z",
			"2026-11-01T06:15:00.000Z",
			"2026-11-01T06:30:00.000Z",
		]);
	});

	it("enforces duration, notice, booking horizon, and a snapshotted trailing break", () => {
		const now = new Date("2026-11-22T07:00:00Z");
		const options = schedule("UTC", [rule("08:30", "10:30")]);
		options.scheduling = withSchedulingDefaults({
			minimumNoticeHours: 2,
			bookingHorizonDays: 7,
			bufferMinutes: 10,
		});
		const end = new Date("2026-12-01T00:00:00Z");
		const slots = findLessonSlots(options, 60, now, now, end);
		expect(slots.map(({ start }) => start.toISOString())).toEqual([
			"2026-11-22T09:00:00.000Z",
			"2026-11-22T09:15:00.000Z",
			"2026-11-22T09:30:00.000Z",
		]);
		expect(slots[0].end.toISOString()).toBe("2026-11-22T10:00:00.000Z");
		expect(slots[0].blockedUntil.toISOString()).toBe(
			"2026-11-22T10:10:00.000Z",
		);
		expect(findLessonSlots(options, 45, now, now, end)).toEqual([]);
	});

	it("bounds time-off inputs and rejects conflicting notice and horizon inputs", () => {
		expect(
			schedulingSettingsSchema.safeParse(
				withSchedulingDefaults({ timeOffDates: ["2026-02-29"] }),
			).success,
		).toBe(false);
		expect(
			schedulingSettingsSchema.safeParse(
				withSchedulingDefaults({
					minimumNoticeHours: 168,
					bookingHorizonDays: 7,
				}),
			).success,
		).toBe(false);
		expect(
			schedulingSettingsSchema.safeParse(withSchedulingDefaults()).success,
		).toBe(true);
	});
});
