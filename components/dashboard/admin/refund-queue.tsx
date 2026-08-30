"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideRefund } from "@/actions/refunds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RefundRequestDTO } from "@/lib/types";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

const statusStyles = {
	pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	rejected: "bg-destructive/10 text-destructive",
};

export function RefundQueue({ requests }: { requests: RefundRequestDTO[] }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [note, setNote] = useState("");

	function decide(requestId: string, decision: "approved" | "rejected") {
		setError("");
		startTransition(async () => {
			const result = await decideRefund(requestId, decision, note || undefined);
			if (result.success) {
				setRejectingId(null);
				setNote("");
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	}

	if (!requests.length) {
		return (
			<div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
				<p className="text-sm text-muted-foreground">
					No refund requests yet.
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
					className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h3 className="text-base font-semibold text-foreground">
								{request.subject} lesson · {request.currency} {request.amount}
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								with {request.tutorName} ·{" "}
								{dateTimeFormatter.format(new Date(request.lessonStart))}
							</p>
						</div>
						<span
							className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}
						>
							{request.status}
						</span>
					</div>

					<p className="mt-3 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-foreground">
						“{request.reason}”
					</p>

					{request.status !== "pending" && request.adminNote && (
						<p className="mt-2 text-xs text-muted-foreground">
							Admin note: {request.adminNote}
						</p>
					)}

					{request.status === "pending" && (
						<div className="mt-4">
							{rejectingId === request.id ? (
								<div className="flex flex-col gap-2">
									<Textarea
										value={note}
										onChange={(event) => setNote(event.target.value)}
										placeholder="Optional note to the student…"
										rows={2}
										maxLength={500}
									/>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="destructive"
											disabled={isPending}
											onClick={() => decide(request.id, "rejected")}
										>
											Confirm rejection
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setRejectingId(null);
												setNote("");
											}}
										>
											Back
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-center gap-3">
									<Button
										size="sm"
										disabled={isPending}
										onClick={() => decide(request.id, "approved")}
									>
										{isPending ? "Processing..." : "Approve & refund"}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										disabled={isPending}
										onClick={() => setRejectingId(request.id)}
									>
										Reject
									</Button>
								</div>
							)}
						</div>
					)}
				</article>
			))}
		</div>
	);
}

export function RefundSearchHint() {
	return <Input type="search" placeholder="Search refunds…" disabled />;
}
