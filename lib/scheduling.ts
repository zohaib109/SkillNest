import { timeToMinutes } from "@/lib/availability";
import { LESSON_DURATIONS } from "@/lib/constants";
import type { AvailabilityRule, SchedulingSettings } from "@/lib/types";

export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;
export const HOLD_MINUTES = 10;

export const DEFAULT_SCHEDULING = {
	minimumNoticeHours: 12,
	bookingHorizonDays: 30,
	bufferMinutes: 0,
} as const;

export function withSchedulingDefaults(
	settings?: Partial<SchedulingSettings> | null,
): SchedulingSettings {
	return { ...DEFAULT_SCHEDULING, timeOffDates: [], ...settings };
}

interface Schedule {
	timezone: string;
	lessonDurations: number[];
	availabilityRules: AvailabilityRule[];
	scheduling: SchedulingSettings;
}

export interface LessonSlot {
	start: Date;
	end: Date;
	blockedUntil: Date;
}

export function isSupportedTimeZone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value });
		return true;
	} catch {
		return false;
	}
}

function wallClock(timezone: string) {
	const formatter = new Intl.DateTimeFormat("en-GB", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	});
	return (instant: number) => {
		const parts = Object.fromEntries(
			formatter.formatToParts(instant).map(({ type, value }) => [type, value]),
		);
		return Date.UTC(
			Number(parts.year),
			Number(parts.month) - 1,
			Number(parts.day),
			Number(parts.hour),
			Number(parts.minute),
		);
	};
}

/** Read a bounded UTC range of real lessons from tutor-local weekly hours. */
export function findLessonSlots(
	schedule: Schedule,
	duration: number,
	now: Date,
	from: Date,
	until: Date,
): LessonSlot[] {
	if (
		!LESSON_DURATIONS.some((value) => value === duration) ||
		!schedule.lessonDurations.includes(duration) ||
		!isSupportedTimeZone(schedule.timezone)
	) {
		return [];
	}

	const {
		minimumNoticeHours,
		bookingHorizonDays,
		bufferMinutes,
		timeOffDates,
	} = schedule.scheduling;
	// Always leave enough time to use the full checkout hold before class.
	const first = Math.max(
		from.getTime(),
		now.getTime() + Math.max(minimumNoticeHours * 60, HOLD_MINUTES) * MINUTE_MS,
	);
	const last = Math.min(
		until.getTime(),
		now.getTime() + bookingHorizonDays * DAY_MS,
	);
	if (first >= last) return [];

	const wallTime = wallClock(schedule.timezone);
	const closed = new Set(timeOffDates);
	const firstDay = Math.floor(wallTime(first) / DAY_MS) * DAY_MS;
	const lastDay = Math.floor(wallTime(last - 1) / DAY_MS) * DAY_MS;
	const slots = new Map<number, LessonSlot>();

	for (let day = firstDay; day <= lastDay; day += DAY_MS) {
		const date = new Date(day);
		if (closed.has(date.toISOString().slice(0, 10))) continue;
		const rules = schedule.availabilityRules.filter(
			(rule) => rule.dayOfWeek === date.getUTCDay(),
		);
		if (!rules.length) continue;

		// Sample both sides of any wall-clock offset change near this civil day.
		// Round-trip each candidate to reject skipped times and keep repeated times.
		const offsets = new Set<number>();
		for (
			let sample = day - DAY_MS;
			sample <= day + 2 * DAY_MS;
			sample += DAY_MS / 4
		) {
			offsets.add(wallTime(sample) - sample);
		}

		for (const rule of rules) {
			const ruleEnd = timeToMinutes(rule.endTime);
			for (
				let minute = timeToMinutes(rule.startTime);
				minute + duration <= ruleEnd;
				minute += 15
			) {
				const localStart = day + minute * MINUTE_MS;
				const localEnd = localStart + duration * MINUTE_MS;
				for (const offset of offsets) {
					const start = localStart - offset;
					const end = localEnd - offset;
					if (start < first || start >= last) continue;
					if (wallTime(start) !== localStart || wallTime(end) !== localEnd)
						continue;
					slots.set(start, {
						start: new Date(start),
						end: new Date(end),
						blockedUntil: new Date(end + bufferMinutes * MINUTE_MS),
					});
				}
			}
		}
	}
	return [...slots.values()].sort(
		(a, b) => a.start.getTime() - b.start.getTime(),
	);
}
