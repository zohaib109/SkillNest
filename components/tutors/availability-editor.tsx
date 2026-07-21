"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAvailability } from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { AvailabilityRule, TutorProfileDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// Display order: Monday first, Sunday last (values still map to Date.getDay()).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityEditor({
	initial,
}: {
	initial: TutorProfileDTO | null;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [rules, setRules] = useState<AvailabilityRule[]>(
		initial?.availabilityRules ?? [],
	);
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	function addSlot(dayOfWeek: number) {
		setRules((prev) => [
			...prev,
			{ dayOfWeek, startTime: "09:00", endTime: "10:00" },
		]);
	}

	function updateSlot(
		index: number,
		field: "startTime" | "endTime",
		value: string,
	) {
		setRules((prev) =>
			prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)),
		);
	}

	function removeSlot(index: number) {
		setRules((prev) => prev.filter((_, i) => i !== index));
	}

	function handleSave() {
		setFeedback(null);
		startTransition(async () => {
			const result = await saveAvailability(rules);
			if (result.success) {
				setFeedback({ type: "success", message: "Availability saved." });
				router.refresh();
			} else {
				setFeedback({ type: "error", message: result.error });
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
			{feedback && (
				<div
					className={cn(
						"rounded-lg border px-4 py-3 text-sm",
						feedback.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-destructive/30 bg-destructive/10 text-destructive",
					)}
				>
					{feedback.message}
				</div>
			)}

			<div className="flex flex-col gap-4">
				{DAY_ORDER.map((dayValue) => {
					const daySlots = rules
						.map((rule, index) => ({ rule, index }))
						.filter(({ rule }) => rule.dayOfWeek === dayValue);

					return (
						<div
							key={dayValue}
							className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
						>
							<div className="w-28 shrink-0 pt-1.5 text-sm font-medium text-foreground">
								{DAYS_OF_WEEK[dayValue]}
							</div>

							<div className="flex flex-1 flex-col gap-2">
								{daySlots.length === 0 && (
									<p className="pt-1.5 text-sm text-muted-foreground">
										Unavailable
									</p>
								)}
								{daySlots.map(({ rule, index }) => (
									<div
										key={`${dayValue}-${index}`}
										className="flex items-center gap-2"
									>
										<Input
											type="time"
											value={rule.startTime}
											onChange={(e) =>
												updateSlot(index, "startTime", e.target.value)
											}
											className="w-32"
										/>
										<span className="text-muted-foreground">–</span>
										<Input
											type="time"
											value={rule.endTime}
											onChange={(e) =>
												updateSlot(index, "endTime", e.target.value)
											}
											className="w-32"
										/>
										<button
											type="button"
											onClick={() => removeSlot(index)}
											className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											aria-label="Remove slot"
										>
											Remove
										</button>
									</div>
								))}
							</div>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => addSlot(dayValue)}
								className="shrink-0"
							>
								+ Add slot
							</Button>
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-3 border-t border-border pt-6">
				<Button type="button" onClick={handleSave} disabled={isPending}>
					{isPending ? "Saving…" : "Save Availability"}
				</Button>
			</div>
		</div>
	);
}
