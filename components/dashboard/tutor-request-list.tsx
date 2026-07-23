"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideLessonRequest } from "@/actions/lesson-requests";
import { Button } from "@/components/ui/button";
import type { LessonRequestDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles = {
	pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	declined: "bg-destructive/10 text-destructive",
};

export function TutorRequestList({ requests }: { requests: LessonRequestDTO[] }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	function decide(requestId: string, decision: "accepted" | "declined") {
		setError("");
		startTransition(async () => {
			const result = await decideLessonRequest(requestId, decision);
			if (result.success) router.refresh();
			else setError(result.error);
		});
	}

	if (!requests.length) {
		return (
			<div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
				<p className="text-sm text-muted-foreground">
					New lesson requests will appear here once your profile is live.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{error && (
				<p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			)}
			{requests.map((request) => (
				<article
					key={request.id}
					className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-base font-semibold text-foreground">
								{request.studentName || "Student"}
							</h2>
							<p className="mt-0.5 text-sm text-muted-foreground">{request.studentEmail}</p>
						</div>
						<span
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
								statusStyles[request.status],
							)}
						>
							{request.status}
						</span>
					</div>
					<div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
						<p>
							<span className="font-semibold text-foreground">Subject:</span> {request.subject}
						</p>
						<p>
							<span className="font-semibold text-foreground">Length:</span> {request.duration} min
						</p>
						<p>
							<span className="font-semibold text-foreground">Preferred:</span> {request.preferredSchedule}
						</p>
					</div>
					<p className="rounded-2xl bg-muted/60 px-3 py-3 text-sm leading-relaxed text-foreground">
						{request.message}
					</p>
					{request.status === "pending" && (
						<div className="flex flex-wrap gap-2 border-t border-border pt-4">
							<Button
								type="button"
								onClick={() => decide(request.id, "accepted")}
								disabled={isPending}
							>
								Accept request
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => decide(request.id, "declined")}
								disabled={isPending}
							>
								Decline
							</Button>
						</div>
					)}
				</article>
			))}
		</div>
	);
}
