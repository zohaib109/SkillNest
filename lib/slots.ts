import type { AvailabilityRule, TutorSlotAvailability } from "@/lib/types";

/**
 * Slot generation engine.
 *
 * Availability rules are weekly windows expressed in the *tutor's* timezone
 * ({ dayOfWeek, startTime, endTime }). This module converts them into concrete
 * UTC instants for the next N days, filters out past slots (lead time) and
 * overlaps with existing bookings, and returns per-duration slot lists.
 *
 * No external timezone library is used: wall-time <-> UTC conversion relies on
 * Intl.DateTimeFormat offset probing (DST-safe via a two-pass adjustment).
 */

const SLOT_STEP_MINUTES = 30;
const MINUTE_MS = 60_000;
/** Students must book at least this far in the future. */
const BOOKING_LEAD_TIME_MS = 60 * MINUTE_MS;
/** How many days ahead slots are offered. */
export const SLOT_HORIZON_DAYS = 14;

type ZonedParts = {
	dateKey: string;
	year: number;
	month: number;
	day: number;
};

function formatterCache(timeZone: string): Intl.DateTimeFormat {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Offset (ms) that must be added to a UTC wall clock to get local wall time at `instant`. */
function tzOffsetMs(instant: Date, timeZone: string): number {
	const parts = formatterCache(timeZone).formatToParts(instant);
	const get = (type: string) =>
		Number(parts.find((p) => p.type === type)?.value ?? "0");
	const asUtc = Date.UTC(
		get("year"),
		get("month") - 1,
		get("day"),
		get("hour"),
		get("minute"),
	);
	return asUtc - instant.getTime();
}

/** The calendar date (YYYY-MM-DD) of `instant` as seen in `timeZone`. */
function localDateKey(instant: Date, timeZone: string): ZonedParts {
	const parts = formatterCache(timeZone).formatToParts(instant);
	const get = (type: string) =>
		parts.find((p) => p.type === type)?.value ?? "01";
	const year = Number(get("year"));
	const month = Number(get("month"));
	const day = Number(get("day"));
	return {
		dateKey: `${get("year")}-${get("month")}-${get("day")}`,
		year,
		month,
		day,
	};
}

/**
 * Convert a wall-clock date+time in `timeZone` to its true UTC instant.
 * Two-pass offset probing handles DST transitions correctly.
 */
export function zonedWallTimeToUtc(
	dateKey: string,
	timeKey: string,
	timeZone: string,
): Date | null {
	const [y, m, d] = dateKey.split("-").map(Number);
	const [hh, mm] = timeKey.split(":").map(Number);
	if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;

	const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);
	let guessMs = wallAsUtc;
	for (let i = 0; i < 2; i++) {
		guessMs = wallAsUtc - tzOffsetMs(new Date(guessMs), timeZone);
	}
	return new Date(guessMs);
}

export function isValidTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone });
		return true;
	} catch {
		return false;
	}
}

/** Civil-date weekdays (0=Sun..6=Sat) for the next `days` dates in `timeZone`. */
function upcomingLocalDays(
	timeZone: string,
	days: number,
	now: Date,
): { dateKey: string; weekday: number }[] {
	const result: { dateKey: string; weekday: number }[] = [];
	const seen = new Set<string>();
	for (let i = 0; i <= days + 1 && result.length < days; i++) {
		const instant = new Date(now.getTime() + i * 24 * 60 * MINUTE_MS);
		const { dateKey, year, month, day } = localDateKey(instant, timeZone);
		if (seen.has(dateKey)) continue;
		seen.add(dateKey);
		result.push({
			dateKey,
			weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
		});
	}
	return result;
}

function overlapsAny(
	startMs: number,
	endMs: number,
	busy: { start: Date; end: Date }[],
): boolean {
	return busy.some(
		(b) => b.start.getTime() < endMs && b.end.getTime() > startMs,
	);
}

export interface SlotGenerationInput {
	rules: AvailabilityRule[];
	durations: number[];
	/** IANA timezone the availability rules are expressed in. Falls back to UTC. */
	timeZone: string;
	/** Existing active bookings (UTC intervals) to exclude. */
	busyIntervals?: { start: Date; end: Date }[];
	now?: Date;
	horizonDays?: number;
}

/**
 * Generate bookable slots grouped by lesson duration.
 * Slot starts are aligned to a fixed grid (every SLOT_STEP_MINUTES inside each
 * availability window), which keeps times predictable across timezones.
 */
export function generateTutorSlotAvailability(
	input: SlotGenerationInput,
): TutorSlotAvailability {
	const timeZone = isValidTimeZone(input.timeZone) ? input.timeZone : "UTC";
	const now = input.now ?? new Date();
	const horizonDays = input.horizonDays ?? SLOT_HORIZON_DAYS;
	const earliest = now.getTime() + BOOKING_LEAD_TIME_MS;
	const busy = input.busyIntervals ?? [];

	const durations = [...new Set(input.durations)]
		.filter((d) => Number.isInteger(d) && d > 0)
		.sort((a, b) => a - b);

	const days = upcomingLocalDays(timeZone, horizonDays, now);

	const slotsByDuration: Record<number, string[]> = {};
	for (const duration of durations) {
		const durationMs = duration * MINUTE_MS;
		const slots = new Set<number>();

		for (const { dateKey, weekday } of days) {
			const dayRules = input.rules.filter((rule) => rule.dayOfWeek === weekday);
			for (const rule of dayRules) {
				const windowStart = zonedWallTimeToUtc(
					dateKey,
					rule.startTime,
					timeZone,
				);
				const windowEnd = zonedWallTimeToUtc(dateKey, rule.endTime, timeZone);
				if (!windowStart || !windowEnd || windowEnd <= windowStart) continue;

				const stepMs = SLOT_STEP_MINUTES * MINUTE_MS;
				for (
					let t = windowStart.getTime();
					t + durationMs <= windowEnd.getTime();
					t += stepMs
				) {
					if (t < earliest) continue;
					if (overlapsAny(t, t + durationMs, busy)) continue;
					slots.add(t);
				}
			}
		}

		slotsByDuration[duration] = [...slots]
			.sort((a, b) => a - b)
			.map((ms) => new Date(ms).toISOString());
	}

	return { durations, slotsByDuration };
}

/** Server-side re-check used before persisting a booking. */
export function isSlotBookable(
	availability: TutorSlotAvailability,
	durationMinutes: number,
	startIso: string,
): boolean {
	const slots = availability.slotsByDuration[durationMinutes];
	if (!slots?.length) return false;
	return slots.includes(startIso);
}
