"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createBooking } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { TutorSlotAvailability } from "@/lib/types";
import { cn } from "@/lib/utils";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});
const dayLabelFormatter = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

export function SlotPicker({
	tutorName,
	tutorSlug,
	subjects,
	availability,
}: {
	tutorName: string;
	tutorSlug: string;
	subjects: string[];
	availability: TutorSlotAvailability;
}) {
	const router = useRouter();
	const durations = availability.durations;
	const [duration, setDuration] = useState(durations[0] ?? 60);
	const [subject, setSubject] = useState(subjects[0] ?? "");
	const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
	const [activeDay, setActiveDay] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const slots = availability.slotsByDuration[duration] ?? [];

	const days = useMemo(() => {
		const groups = new Map<string, string[]>();
		for (const slot of slots) {
			const key = dayKeyFormatter.format(new Date(slot));
			const list = groups.get(key);
			if (list) list.push(slot);
			else groups.set(key, [slot]);
		}
		return [...groups.entries()].map(([key, times]) => ({
			key,
			label: dayLabelFormatter.format(new Date(times[0])),
			times,
		}));
	}, [slots]);

	const effectiveDay =
		activeDay && days.some((d) => d.key === activeDay)
			? activeDay
			: (days[0]?.key ?? null);
	const daySlots = days.find((d) => d.key === effectiveDay)?.times ?? [];

	function pickDuration(next: number) {
		setDuration(next);
		setSelectedSlot(null);
		setActiveDay(null);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedSlot) return;
		setFeedback(null);
		startTransition(async () => {
			const result = await createBooking({
				tutorSlug,
				subject,
				durationMinutes: duration,
				startUtc: selectedSlot,
			});
			if (result.success) {
				if ("checkoutUrl" in result && result.checkoutUrl) {
					window.location.href = result.checkoutUrl;
					return;
				}
				setFeedback({
					type: "success",
					message: `Lesson booked with ${tutorName}. Find it under My Bookings.`,
				});
				setSelectedSlot(null);
				router.refresh();
			} else {
				setFeedback({ type: "error", message: result.error });
				router.refresh();
			}
		});
	}

	if (!days.length) {
		return (
			<p className="text-sm leading-relaxed text-muted-foreground">
				{tutorName} has no open slots in the next 14 days. Send a lesson request
				below instead.
			</p>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{durations.length > 1 && (
				<div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1">
					{durations.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => pickDuration(item)}
							className={cn(
								"rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
								duration === item
									? "bg-card text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{item} min
						</button>
					))}
				</div>
			)}

			<div>
				<p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Pick a day
				</p>
				<div className="flex gap-1.5 overflow-x-auto pb-1">
					{days.map((day) => (
						<button
							key={day.key}
							type="button"
							onClick={() => {
								setActiveDay(day.key);
								setSelectedSlot(null);
							}}
							className={cn(
								"shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
								effectiveDay === day.key
									? "border-primary bg-primary/10 text-primary"
									: "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
							)}
						>
							{day.label}
						</button>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Available times (your timezone)
				</p>
				<div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
					{daySlots.map((slot) => (
						<button
							key={slot}
							type="button"
							onClick={() => setSelectedSlot(slot)}
							className={cn(
								"rounded-lg border px-1 py-1.5 text-xs font-semibold transition-all cursor-pointer",
								selectedSlot === slot
									? "border-primary bg-primary text-primary-foreground"
									: "border-border text-foreground hover:border-primary/40",
							)}
						>
							{timeFormatter.format(new Date(slot))}
						</button>
					))}
				</div>
			</div>

			<label
				htmlFor="booking-subject"
				className="flex flex-col gap-1.5 text-sm font-semibold text-foreground"
			>
				Subject
				<Select
					id="booking-subject"
					value={subject}
					onChange={(event) => setSubject(event.target.value)}
				>
					{subjects.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</Select>
			</label>

			{feedback && (
				<p
					className={cn(
						"rounded-xl border px-3 py-2 text-sm leading-relaxed",
						feedback.type === "success"
							? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
							: "border-destructive/30 bg-destructive/10 text-destructive",
					)}
				>
					{feedback.message}
				</p>
			)}

			<Button type="submit" size="lg" disabled={isPending || !selectedSlot}>
				{isPending
					? "Booking..."
					: selectedSlot
						? "Continue to payment"
						: "Select a time"}
			</Button>
			<p className="text-center text-xs leading-relaxed text-muted-foreground">
				Your slot is held for 30 minutes while you pay. Cancel anytime from My
				Bookings.
			</p>
		</form>
	);
}
