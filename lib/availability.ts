import type { AvailabilityRule } from "@/lib/types";

function toMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
}

export function hasOverlappingAvailabilityRules(
	rules: AvailabilityRule[],
): boolean {
	const rulesByDay = new Map<number, AvailabilityRule[]>();

	for (const rule of rules) {
		const dayRules = rulesByDay.get(rule.dayOfWeek) ?? [];
		dayRules.push(rule);
		rulesByDay.set(rule.dayOfWeek, dayRules);
	}

	for (const dayRules of rulesByDay.values()) {
		const sorted = [...dayRules].sort(
			(a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
		);

		for (let index = 1; index < sorted.length; index += 1) {
			if (
				toMinutes(sorted[index].startTime) <
				toMinutes(sorted[index - 1].endTime)
			) {
				return true;
			}
		}
	}

	return false;
}
