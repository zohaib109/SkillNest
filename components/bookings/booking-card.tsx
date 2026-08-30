"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelBooking, payBooking } from "@/actions/bookings";
import { requestRefund } from "@/actions/refunds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { BookingDTO, RefundRequestDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

const statusStyles: Record<string, string> = {
	confirmed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	pending_payment: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	completed: "bg-muted text-muted-foreground",
	expired: "bg-muted text-muted-foreground",
	cancelled_by_student: "bg-destructive/10 text-destructive",
	cancelled_by_tutor: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
	confirmed: "Confirmed",
	pending_payment: "Awaiting payment",
	completed: "Completed",
	expired: "Expired",
	cancelled_by_student: "Cancelled by you",
	cancelled_by_tutor: "Cancelled by tutor",
};

const paymentLabels: Record<string, string> = {
	unpaid: "Unpaid",
	paid: "Paid",
	refunded: "Refunded",
};

export function BookingCard({
	booking,
	viewerRole,
	refund,
}: {
	booking: BookingDTO;
	viewerRole: "student" | "tutor";
	refund?: RefundRequestDTO | null;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");
	const [showRefundForm, setShowRefundForm] = useState(false);
	const [refundReason, setRefundReason] = useState("");

	const start = new Date(booking.startTime);
	const end = new Date(booking.endTime);
	const isUpcoming =
		(booking.status === "confirmed" || booking.status === "pending_payment") &&
		end.getTime() > Date.now();
	const canRequestRefund =
		viewerRole === "student" &&
		booking.status === "confirmed" &&
		booking.paymentStatus === "paid" &&
		start.getTime() > Date.now() &&
		!refund;
	const counterpart =
		viewerRole === "student" ? booking.tutorName : booking.studentName;
	const slugBase =
		viewerRole === "student" ? `/tutors/${booking.tutorSlug}` : null;

	function handleCancel() {
		setError("");
		startTransition(async () => {
			const result = await cancelBooking(booking.id);
			if (result.success) {
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	}

	function handlePay() {
		setError("");
		startTransition(async () => {
			const result = await payBooking(booking.id);
			if (result.success && result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
			} else if (!result.success) {
				setError(result.error);
			}
		});
	}

	function handleRefundSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		startTransition(async () => {
			const result = await requestRefund(booking.id, refundReason);
			if (result.success) {
				setShowRefundForm(false);
				setRefundReason("");
				router.refresh();
			} else {
				setError(result.error);
			}
		});
	}

	return (
		<article className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-semibold text-foreground">
						{counterpart}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{booking.subject} · {booking.durationMinutes} min ·{" "}
						{booking.priceCurrency} {booking.priceAmount}
					</p>
				</div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						statusStyles[booking.status] ?? statusStyles.completed,
					)}
				>
					{statusLabels[booking.status] ?? booking.status}
				</span>
			</div>

			<p className="mt-3 rounded-2xl bg-muted/60 px-3 py-2 text-sm font-medium text-foreground">
				{dateTimeFormatter.format(start)} – {timeFormatter.format(end)}
				<span className="ml-1 text-xs font-normal text-muted-foreground">
					(your timezone)
				</span>
				<span
					className={cn(
						"ml-2 rounded-full px-2 py-0.5 text-xs font-semibold",
						booking.paymentStatus === "paid"
							? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
							: booking.paymentStatus === "refunded"
								? "bg-destructive/10 text-destructive"
								: "bg-muted text-muted-foreground",
					)}
				>
					{paymentLabels[booking.paymentStatus] ?? booking.paymentStatus}
				</span>
			</p>

			{booking.status === "pending_payment" &&
				viewerRole === "student" &&
				isUpcoming && (
					<p className="mt-2 text-xs text-muted-foreground">
						This slot is held for you — complete payment to lock it in.
					</p>
				)}

			{refund && (
				<div className="mt-3 rounded-2xl border border-border bg-muted/50 px-3 py-2 text-sm">
					<span
						className={cn(
							"font-semibold",
							refund.status === "pending"
								? "text-amber-700 dark:text-amber-300"
								: refund.status === "approved"
									? "text-emerald-700 dark:text-emerald-300"
									: "text-destructive",
						)}
					>
						Refund {refund.status}
					</span>
					<span className="text-muted-foreground"> — {refund.reason}</span>
					{refund.adminNote && (
						<p className="mt-1 text-xs text-muted-foreground">
							Admin note: {refund.adminNote}
						</p>
					)}
				</div>
			)}

			{showRefundForm && viewerRole === "student" && (
				<form onSubmit={handleRefundSubmit} className="mt-3 flex flex-col gap-2">
					<Textarea
						value={refundReason}
						onChange={(event) => setRefundReason(event.target.value)}
						placeholder="Briefly explain why you need a refund…"
						rows={3}
						maxLength={1000}
						required
					/>
					<div className="flex gap-2">
						<Button type="submit" size="sm" disabled={isPending}>
							{isPending ? "Submitting..." : "Submit request"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setShowRefundForm(false)}
						>
							Cancel
						</Button>
					</div>
				</form>
			)}

			{booking.cancellationReason && (
				<p className="mt-2 text-sm text-muted-foreground">
					Reason: {booking.cancellationReason}
				</p>
			)}

			{error && (
				<p className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</p>
			)}

			{isUpcoming && (
				<div className="mt-4 flex flex-wrap items-center gap-4">
					{viewerRole === "student" && booking.status === "pending_payment" && (
						<Button onClick={handlePay} disabled={isPending}>
							{isPending ? "Opening checkout..." : "Complete payment"}
						</Button>
					)}
					{canRequestRefund && !showRefundForm && (
						<button
							type="button"
							onClick={() => setShowRefundForm(true)}
							className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
						>
							Request refund
						</button>
					)}
					<button
						type="button"
						onClick={handleCancel}
						disabled={isPending}
						className="text-sm font-semibold text-destructive hover:underline disabled:opacity-50 cursor-pointer"
					>
						{isPending ? "Cancelling..." : "Cancel lesson"}
					</button>
					{slugBase && booking.status !== "pending_payment" && (
						<Link
							href={slugBase}
							className="text-sm font-semibold text-primary hover:underline"
						>
							View tutor
						</Link>
					)}
				</div>
			)}
		</article>
	);
}
