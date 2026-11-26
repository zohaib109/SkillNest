"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const systemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useLocalTimezone() {
	return useSyncExternalStore(subscribe, systemTimezone, () => "UTC");
}

export function LocalTime({ value }: { value: string }) {
	const timeZone = useLocalTimezone();
	const formatted = new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "shortOffset",
	}).format(new Date(value));
	return <time dateTime={value}>{formatted}</time>;
}
