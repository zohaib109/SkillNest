"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveTutor, rejectTutor } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TutorProfileDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TutorModerationList({
	profiles,
}: {
	profiles: TutorProfileDTO[];
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	function handleApprove(id: string) {
		setError(null);
		startTransition(async () => {
			const result = await approveTutor(id);
			if (result.success) {
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	}

	function handleReject(id: string) {
		setError(null);
		startTransition(async () => {
			const result = await rejectTutor(id, reason);
			if (result.success) {
				setRejectingId(null);
				setReason("");
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	}

	if (profiles.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
				<p className="text-sm text-muted-foreground">
					No tutor profiles awaiting review.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{error && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{profiles.map((profile) => (
				<div
					key={profile.id}
					className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-lg text-foreground">
								{profile.userName || "Unnamed tutor"}
							</h3>
							<p className="text-sm text-muted-foreground">
								{profile.userEmail}
							</p>
						</div>
						<span
							className={cn(
								"inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize",
								profile.status === "pending_review"
									? "bg-amber-100 text-amber-700"
									: profile.status === "approved"
										? "bg-emerald-100 text-emerald-700"
										: profile.status === "rejected"
											? "bg-destructive/10 text-destructive"
											: "bg-muted text-muted-foreground",
							)}
						>
							{profile.status.replace("_", " ")}
						</span>
					</div>

					<div className="flex flex-col gap-2 text-sm">
						<p className="font-medium text-foreground">{profile.headline}</p>
						<p className="text-muted-foreground">{profile.bio}</p>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
						<span>
							<span className="font-medium text-foreground">Subjects:</span>{" "}
							{profile.subjects.join(", ") || "—"}
						</span>
						<span>
							<span className="font-medium text-foreground">Languages:</span>{" "}
							{profile.languages.join(", ") || "—"}
						</span>
						<span>
							<span className="font-medium text-foreground">Rate:</span>{" "}
							{profile.hourlyRate} {profile.currency}/hr
						</span>
						<span>
							<span className="font-medium text-foreground">Country:</span>{" "}
							{profile.country || "—"}
						</span>
					</div>

					{profile.introVideoUrl && (
						<a
							href={profile.introVideoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-primary hover:underline"
						>
							Watch intro video →
						</a>
					)}

					{profile.status === "pending_review" &&
						(rejectingId === profile.id ? (
							<div className="flex flex-col gap-3 border-t border-border pt-4">
								<Textarea
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="Explain what the tutor needs to change…"
									rows={3}
								/>
								<div className="flex items-center gap-3">
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => handleReject(profile.id)}
										disabled={isPending}
									>
										Confirm Rejection
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											setRejectingId(null);
											setReason("");
										}}
										disabled={isPending}
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<div className="flex items-center gap-3 border-t border-border pt-4">
								<Button
									type="button"
									size="sm"
									onClick={() => handleApprove(profile.id)}
									disabled={isPending}
								>
									Approve
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setRejectingId(profile.id);
										setReason("");
									}}
									disabled={isPending}
								>
									Reject
								</Button>
							</div>
						))}
				</div>
			))}
		</div>
	);
}
