import Link from "next/link";
import { CancelHoldForm } from "@/components/dashboard/cancel-hold-form";
import { SandboxCheckoutForm } from "@/components/dashboard/sandbox-checkout-form";
import { LocalTime } from "@/components/tutors/local-time";
import { buttonVariants } from "@/components/ui/button";
import { formatLessonPrice } from "@/lib/booking-terms";
import { listStudentBookings } from "@/lib/bookings";
import { requireVerifiedRole } from "@/lib/permissions";
import { sandboxPaymentsEnabled } from "@/lib/sandbox-payments";

export default async function StudentBookingsPage() {
	const session = await requireVerifiedRole("student");
	const bookings = await listStudentBookings(session.user.id);
	const now = new Date();
	const canSimulate = sandboxPaymentsEnabled();
	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl tracking-tight">My Bookings</h1>
				<Link href="/tutors" className={buttonVariants({ variant: "outline" })}>
					Find a tutor
				</Link>
			</div>
			{canSimulate && (
				<p className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
					Sandbox checkout simulates payments using test data only.
				</p>
			)}
			{bookings.length === 0 ? (
				<p className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
					Choose a tutor and hold an available lesson time to get started.
				</p>
			) : (
				<ul className="space-y-3">
					{bookings.map((booking) => {
						const status =
							booking.status === "held" && booking.holdExpiresAt <= now
								? "expired"
								: booking.status;
						const bookingId = String(booking._id);
						return (
							<li
								key={bookingId}
								className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-white p-5"
							>
								<div className="space-y-1">
									<h2 className="text-lg font-semibold">
										Lesson with {booking.tutorName}
									</h2>
									<p className="text-sm text-muted-foreground">
										<LocalTime value={booking.startsAt.toISOString()} /> ·{" "}
										{booking.duration} min
									</p>
									<p className="text-sm">
										{formatLessonPrice(booking.amountMinor, booking.currency)} ·{" "}
										{booking.paymentMode === "sandbox" && status === "confirmed"
											? "Confirmed · sandbox"
											: status === "held"
												? "Unpaid hold"
												: status.charAt(0).toUpperCase() + status.slice(1)}
									</p>
								</div>
								{status === "held" && (
									<div className="space-y-2">
										<CancelHoldForm
											bookingId={bookingId}
											expiresAt={booking.holdExpiresAt.toISOString()}
										/>
										{canSimulate && (
											<SandboxCheckoutForm bookingId={bookingId} />
										)}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
