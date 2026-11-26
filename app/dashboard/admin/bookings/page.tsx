import { reviewMessageReport } from "@/actions/booking-messages";
import { RefundReviewForm } from "@/components/dashboard/admin/refund-review-form";
import { LocalTime } from "@/components/tutors/local-time";
import { pendingMessageReports } from "@/lib/booking-messages";
import { formatLessonPrice } from "@/lib/booking-terms";
import { listRecentBookings } from "@/lib/bookings";
import { requireVerifiedRole } from "@/lib/permissions";
import { listSandboxReconciliation } from "@/lib/refunds";
import { sandboxPaymentsEnabled } from "@/lib/sandbox-payments";

export default async function AdminBookingsPage() {
	await requireVerifiedRole("admin");
	const now = new Date();
	const canReview = sandboxPaymentsEnabled();
	const [bookings, reconciliation, reports] = await Promise.all([
		listRecentBookings(),
		canReview ? listSandboxReconciliation() : null,
		pendingMessageReports(),
	]);
	return (
		<div className="space-y-6">
			<h1 className="text-3xl tracking-tight text-foreground">
				Booking Oversight
			</h1>
			{reports.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-xl">Reported lesson messages</h2>
					{reports.map((report) => (
						<article
							className="rounded-xl border border-border p-4"
							key={report._id}
						>
							<p className="text-sm">
								Booking {String(report.bookingId)} · sent by {report.senderRole}
							</p>
							<blockquote className="my-2 wrap-anywhere whitespace-pre-wrap">
								{report.excerpt}
							</blockquote>
							<p className="wrap-anywhere">Report reason · {report.reason}</p>
							<form
								action={reviewMessageReport.bind(null, report._id)}
								className="mt-2 space-y-2"
							>
								<label>
									Review decision
									<input
										className="block w-full rounded border border-border bg-card p-2"
										name="decision"
										required
										minLength={5}
										maxLength={300}
									/>
								</label>
								<button
									type="submit"
									className="cursor-pointer text-primary underline"
								>
									Record decision
								</button>
							</form>
						</article>
					))}
				</section>
			)}
			{reconciliation && (
				<>
					<section className="space-y-3">
						<h2 className="text-xl">Sandbox refund requests</h2>
						{reconciliation.requests.length ? (
							<ul className="grid gap-4 lg:grid-cols-2">
								{reconciliation.requests.map((request) => (
									<li
										key={String(request._id)}
										className="space-y-3 rounded-2xl border border-border bg-white p-4"
									>
										<div>
											<p className="font-semibold">
												{formatLessonPrice(
													request.amountMinor,
													request.currency,
												)}{" "}
												· {request.policyPercent}% mock policy
											</p>
											<p className="break-all text-xs text-muted-foreground">
												Booking {String(request._id)}
											</p>
										</div>
										<p className="wrap-anywhere whitespace-pre-wrap text-sm">
											{request.reason}
										</p>
										<RefundReviewForm
											bookingId={String(request._id)}
											canApprove={request.amountMinor > 0}
										/>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">
								No requests awaiting review.
							</p>
						)}
					</section>
					<section className="space-y-3">
						<h2 className="text-xl">Sandbox payment exceptions</h2>
						{reconciliation.events.length ? (
							<ul className="space-y-2">
								{reconciliation.events.map((event) => (
									<li
										key={event._id}
										className="flex flex-wrap justify-between gap-2 rounded-xl border border-border bg-white p-3 text-sm"
									>
										<div>
											<p className="font-medium">
												{event.outcome === "amount_mismatch"
													? "Amount or currency mismatch"
													: "Late capture requires reconciliation"}
											</p>
											<p className="break-all text-xs text-muted-foreground">
												Booking {String(event.paymentId)}
											</p>
										</div>
										<p>
											{formatLessonPrice(event.amountMinor, event.currency)} ·{" "}
											<LocalTime value={event.verifiedAt.toISOString()} />
										</p>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">
								No payment exceptions recorded.
							</p>
						)}
					</section>
				</>
			)}
			<section className="space-y-3">
				<h2 className="text-xl">Recent bookings</h2>
				{bookings.length ? (
					<ul className="space-y-2">
						{bookings.map((booking) => {
							const status =
								booking.status === "held" && booking.holdExpiresAt <= now
									? "expired"
									: booking.status;
							return (
								<li
									key={String(booking._id)}
									className="flex flex-wrap justify-between gap-2 rounded-xl border border-border bg-white p-3 text-sm"
								>
									<div>
										<p className="font-medium">
											{booking.tutorName} ·{" "}
											<LocalTime value={booking.startsAt.toISOString()} />
										</p>
										<p className="break-all text-xs text-muted-foreground">
											Booking {String(booking._id)}
										</p>
									</div>
									<p>
										<span className="capitalize">{status}</span> ·{" "}
										{formatLessonPrice(booking.amountMinor, booking.currency)}
										{booking.paymentMode === "sandbox" && " · sandbox"}
									</p>
								</li>
							);
						})}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">No bookings recorded.</p>
				)}
			</section>
		</div>
	);
}
