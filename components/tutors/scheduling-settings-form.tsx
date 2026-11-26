"use client";

import { useState, useTransition } from "react";
import { saveSchedulingSettings } from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SchedulingSettings } from "@/lib/types";

export function SchedulingSettingsForm({
	initial,
}: {
	initial: SchedulingSettings;
}) {
	const [dates, setDates] = useState(initial.timeOffDates);
	const [newDate, setNewDate] = useState("");
	const [pending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		success: boolean;
		message: string;
	}>();

	function save(form: FormData) {
		setFeedback(undefined);
		startTransition(async () => {
			try {
				const result = await saveSchedulingSettings({
					minimumNoticeHours: Number(form.get("notice")),
					bookingHorizonDays: Number(form.get("horizon")),
					bufferMinutes: Number(form.get("buffer")),
					timeOffDates: dates,
				});
				setFeedback({
					success: result.success,
					message: result.success ? "Booking settings saved." : result.error,
				});
			} catch {
				setFeedback({
					success: false,
					message: "Couldn't save booking settings. Try again.",
				});
			}
		});
	}

	return (
		<section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
			<h2 className="text-xl">Booking settings</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				These settings apply to new reservations. Time off blocks the whole date
				in your profile timezone.
			</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					save(new FormData(event.currentTarget));
				}}
				className="mt-5"
			>
				<fieldset disabled={pending} className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-3">
						<label htmlFor="schedule-notice" className="space-y-2 text-sm">
							Minimum notice (hours)
							<Input
								id="schedule-notice"
								name="notice"
								type="number"
								required
								min={0}
								max={168}
								defaultValue={initial.minimumNoticeHours}
							/>
						</label>
						<label htmlFor="schedule-horizon" className="space-y-2 text-sm">
							Booking window (days)
							<Input
								id="schedule-horizon"
								name="horizon"
								type="number"
								required
								min={7}
								max={60}
								defaultValue={initial.bookingHorizonDays}
							/>
						</label>
						<label htmlFor="schedule-buffer" className="space-y-2 text-sm">
							Break after a lesson (minutes)
							<Input
								id="schedule-buffer"
								name="buffer"
								type="number"
								required
								min={0}
								max={60}
								defaultValue={initial.bufferMinutes}
							/>
						</label>
					</div>
					<div className="space-y-3">
						<label htmlFor="time-off-date" className="text-sm font-medium">
							Time off
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<Input
								id="time-off-date"
								type="date"
								className="max-w-44"
								value={newDate}
								onChange={(event) => setNewDate(event.target.value)}
							/>
							<Button
								type="button"
								variant="outline"
								disabled={
									!newDate || dates.includes(newDate) || dates.length >= 60
								}
								onClick={() => {
									setDates([...dates, newDate].sort());
									setNewDate("");
								}}
							>
								Add date
							</Button>
						</div>
						{dates.length > 0 && (
							<ul className="flex flex-wrap gap-2">
								{dates.map((date) => (
									<li
										key={date}
										className="flex items-center gap-1 rounded-lg border border-border pl-3 text-sm"
									>
										<time dateTime={date}>{date}</time>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											aria-label={`Remove ${date}`}
											onClick={() =>
												setDates(dates.filter((item) => item !== date))
											}
										>
											Remove
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>
					<Button type="submit">
						{pending ? "Saving…" : "Save booking settings"}
					</Button>
				</fieldset>
			</form>
			{feedback && (
				<p
					role={feedback.success ? "status" : "alert"}
					className={
						feedback.success ? "mt-3 text-sm" : "mt-3 text-sm text-destructive"
					}
				>
					{feedback.message}
				</p>
			)}
		</section>
	);
}
