"use client";

import { useActionState } from "react";
import { publishRecap, savePracticeResponse } from "@/actions/lesson-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RecapForm({ id }: { id: string }) {
	const [error, action, pending] = useActionState(publishRecap, "");
	return (
		<details className="w-full border-t border-border pt-3">
			<summary className="cursor-pointer font-medium">
				Add a lesson recap
			</summary>
			<form action={action} className="mt-3 grid gap-3">
				<input type="hidden" name="bookingId" value={id} />
				<label htmlFor={`practised-${id}`}>
					What did you practise together?
					<Textarea
						required
						minLength={3}
						maxLength={400}
						id={`practised-${id}`}
						name="practised"
					/>
				</label>
				<label htmlFor={`exercise-${id}`}>
					One exercise to try independently
					<Textarea
						required
						minLength={3}
						maxLength={300}
						id={`exercise-${id}`}
						name="exercise"
					/>
				</label>
				<label htmlFor={`resource-${id}`}>
					Learning resource (optional HTTPS link)
					<Input
						type="url"
						maxLength={500}
						id={`resource-${id}`}
						name="resource"
					/>
				</label>
				<label className="flex items-center gap-2">
					<input type="checkbox" name="delivered" value="yes" required />I
					taught this lesson.
				</label>
				<p className="text-sm text-muted-foreground">
					Your student will see these notes. Check them before publishing.
				</p>
				<Button type="submit" disabled={pending}>
					Publish recap
				</Button>
				{error && <p role="alert">{error}</p>}
			</form>
		</details>
	);
}

const outcomes = {
	independent: "I did it independently",
	needs_help: "I still need help",
} as const;
export function LessonRecap({
	recap,
	response,
	studentBookingId,
}: {
	recap: { practised: string; exercise: string; resource?: string | null };
	response?: keyof typeof outcomes | null;
	studentBookingId?: string;
}) {
	const [error, action, pending] = useActionState(savePracticeResponse, "");
	return (
		<section className="w-full space-y-2 rounded-xl bg-muted p-4">
			<h3 className="font-semibold">Lesson recap</h3>
			<p className="whitespace-pre-wrap break-words">{recap.practised}</p>
			<h4 className="text-sm font-semibold">Try this independently</h4>
			<p className="whitespace-pre-wrap break-words">{recap.exercise}</p>
			{recap.resource && (
				<a
					href={recap.resource}
					target="_blank"
					rel="noreferrer"
					className="text-primary underline"
				>
					Open learning resource
				</a>
			)}
			<p aria-live="polite" className="text-sm">
				{response
					? `Learner response · ${outcomes[response]}`
					: "Practice response pending"}
			</p>
			{studentBookingId && (
				<form action={action} className="flex flex-wrap gap-2">
					<input type="hidden" name="bookingId" value={studentBookingId} />
					{(["independent", "needs_help"] as const).map((value) => (
						<Button
							key={value}
							disabled={pending}
							type="submit"
							name="response"
							value={value}
							aria-pressed={response === value}
							variant={response === value ? "default" : "outline"}
							size="sm"
						>
							{outcomes[value]}
						</Button>
					))}
					{error && <p role="alert">{error}</p>}
				</form>
			)}
		</section>
	);
}
