import Link from "next/link";
import { listMyBookings } from "@/actions/bookings";
import { listMyRefundRequests } from "@/actions/refunds";
import { BookingCard } from "@/components/bookings/booking-card";
import { getLessonRequestsForStudent } from "@/lib/lesson-requests";
import { requireUser } from "@/lib/permissions";
import type { BookingDTO } from "@/lib/types";

const statusStyles = {
	pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	declined: "bg-destructive/10 text-destructive",
};

function splitBookings(bookings: BookingDTO[]) {
	const now = Date.now();
	const upcoming: BookingDTO[] = [];
	const past: BookingDTO[] = [];
	for (const booking of bookings) {
		const isPast =
			new Date(booking.endTime).getTime() < now ||
			booking.status.startsWith("cancelled");
		if (isPast) past.push(booking);
		else upcoming.push(booking);
	}
	upcoming.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
	return { upcoming, past };
}

export default async function BookingsPage({
	searchParams,
}: {
	searchParams: Promise<{ payment?: string }>;
}) {
	const [session, { payment }] = await Promise.all([
		requireUser(),
		searchParams,
	]);
	const bookings = await listMyBookings();
	const { upcoming, past } = splitBookings(bookings);
	const refunds = await listMyRefundRequests();
	const refundByBookingId = new Map(refunds.map((r) => [r.bookingId, r]));

	const requests =
		session.user.role === "student"
			? await getLessonRequestsForStudent(session.user.id)
			: [];

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						{session.user.role === "tutor"
							? "Teaching workspace"
							: "Learning workspace"}
					</p>
					<h1 className="mt-1 text-3xl tracking-tight text-foreground">
						{session.user.role === "tutor" ? "My schedule" : "My lessons"}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Times are shown in your local timezone.
					</p>
				</div>
				{session.user.role === "student" && (
					<Link
						href="/tutors"
						className="w-fit text-sm font-semibold text-primary hover:underline"
					>
						Find another tutor →
					</Link>
				)}
			</header>

			{payment === "success" && (
				<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
					Payment received! Your lesson is confirmed. It may take a few seconds
					to update.
				</div>
			)}
			{payment === "cancelled" && (
				<div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
					Checkout was cancelled. Your booking is still awaiting payment.
				</div>
			)}

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold text-foreground">
					Upcoming lessons
				</h2>
				{upcoming.length ? (
					upcoming.map((booking) => (
						<BookingCard
							key={booking.id}
							booking={booking}
							viewerRole={session.user.role === "tutor" ? "tutor" : "student"}
							refund={refundByBookingId.get(booking.id) ?? null}
						/>
					))
				) : (
					<div className="rounded-3xl border border-dashed border-border bg-card px-5 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							No upcoming lessons yet.
						</p>
						{session.user.role === "student" && (
							<Link
								href="/tutors"
								className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
							>
								Browse approved tutors →
							</Link>
						)}
						{session.user.role === "tutor" && (
							<p className="mt-2 text-xs text-muted-foreground">
								Add weekly availability to your profile so students can book
								you.
							</p>
						)}
					</div>
				)}
			</section>

			{past.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-semibold text-foreground">
						History ({past.length})
					</h2>
					{past.map((booking) => (
						<BookingCard
							key={booking.id}
							booking={booking}
							viewerRole={session.user.role === "tutor" ? "tutor" : "student"}
							refund={refundByBookingId.get(booking.id) ?? null}
						/>
					))}
				</section>
			)}

			{session.user.role === "student" && (
				<section className="flex flex-col gap-3 border-t border-border pt-5">
					<h2 className="text-lg font-semibold text-foreground">
						Lesson requests
					</h2>
					{requests.length ? (
						requests.map((request) => (
							<article
								key={request.id}
								className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h3 className="text-base font-semibold text-foreground">
											{request.tutorName}
										</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											{request.subject} · {request.duration} minutes
										</p>
									</div>
									<span
										className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}
									>
										{request.status}
									</span>
								</div>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									Preferred time: {request.preferredSchedule}
								</p>
							</article>
						))
					) : (
						<p className="rounded-3xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
							You have not sent a lesson request yet.
						</p>
					)}
				</section>
			)}
		</div>
	);
}
