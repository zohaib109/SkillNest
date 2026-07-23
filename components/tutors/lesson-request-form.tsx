"use client";

import { useState, useTransition } from "react";
import { createLessonRequest } from "@/actions/lesson-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function LessonRequestForm({
	tutorName,
	tutorSlug,
	subjects,
	durations,
}: {
	tutorName: string;
	tutorSlug: string;
	subjects: string[];
	durations: number[];
}) {
	const [subject, setSubject] = useState(subjects[0] ?? "");
	const [duration, setDuration] = useState(String(durations[0] ?? 60));
	const [preferredSchedule, setPreferredSchedule] = useState("");
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFeedback(null);
		startTransition(async () => {
			const result = await createLessonRequest({
				tutorSlug,
				subject,
				duration: Number(duration),
				preferredSchedule,
				message,
			});
			if (result.success) {
				setFeedback({
					type: "success",
					message: `Your request is with ${tutorName}. You can track it from My Requests.`,
				});
				setPreferredSchedule("");
				setMessage("");
			} else {
				setFeedback({ type: "error", message: result.error });
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
					Subject
					<Select value={subject} onChange={(event) => setSubject(event.target.value)}>
						{subjects.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</Select>
				</label>
				<label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
					Lesson length
					<Select value={duration} onChange={(event) => setDuration(event.target.value)}>
						{durations.map((item) => (
							<option key={item} value={item}>
								{item} minutes
							</option>
						))}
					</Select>
				</label>
			</div>
			<label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
				When would you like to learn?
				<Input
					value={preferredSchedule}
					onChange={(event) => setPreferredSchedule(event.target.value)}
					placeholder="e.g. Weekday evenings after 6pm (UTC+5)"
					maxLength={280}
					required
				/>
			</label>
			<label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
				What would you like help with?
				<Textarea
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder="Briefly share your goal, current level, or the topic you want to cover."
					rows={4}
					maxLength={1_000}
					required
				/>
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
			<Button type="submit" size="lg" disabled={isPending} className="w-full">
				{isPending ? "Sending request..." : "Request a lesson"}
			</Button>
			<p className="text-center text-xs leading-relaxed text-muted-foreground">
				This starts a request only. There is no payment or chat at this stage.
			</p>
		</form>
	);
}
