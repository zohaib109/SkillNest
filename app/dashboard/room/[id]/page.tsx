import Link from "next/link";
import { notFound } from "next/navigation";
import {
	CheckInForm,
	DevicePreview,
	LessonIssueForm,
} from "@/components/dashboard/room-controls";
import { LocalTime } from "@/components/tutors/local-time";
import { getSession } from "@/lib/auth-server";
import { roomFor } from "@/lib/lesson-room";
import { bookingIdSchema } from "@/lib/validators/booking";
export default async function LessonRoom({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await getSession();
	const role = session?.user.role;
	if (
		!session?.user.emailVerified ||
		(role !== "student" && role !== "tutor") ||
		!bookingIdSchema.safeParse(id).success
	)
		notFound();
	const room = await roomFor(id, { id: session.user.id, role });
	if (!room) notFound();
	const own = role === "student" ? room.studentCheckIn : room.tutorCheckIn;
	return (
		<div className="mx-auto max-w-2xl space-y-5">
			<Link
				href={role === "student" ? "/dashboard/bookings" : "/dashboard/lessons"}
				className="text-primary underline"
			>
				Back to my lessons
			</Link>
			<header>
				<h1 className="text-3xl">Lesson room</h1>
				<p className="mt-2">
					{room.tutorName} · <LocalTime value={room.startsAt.toISOString()} />
				</p>
			</header>
			<section className="space-y-3 rounded-xl border border-border bg-card p-5">
				<h2 className="text-xl">Check-in</h2>
				<p className="text-sm">
					Opens <LocalTime value={room.opens.toISOString()} /> and closes{" "}
					<LocalTime value={room.closes.toISOString()} />. Check-in records when
					someone arrived at this page. Live video is currently unavailable.
				</p>
				<ul className="text-sm">
					{[
						["Student", room.studentCheckIn],
						["Tutor", room.tutorCheckIn],
					].map(([label, date]) => (
						<li key={String(label)}>
							{String(label)} ·{" "}
							{date instanceof Date ? (
								<LocalTime value={date.toISOString()} />
							) : (
								"Awaiting check-in"
							)}
						</li>
					))}
				</ul>
				<CheckInForm id={id} enabled={room.canCheckIn && !own} />
				<Link
					href={`/dashboard/messages/${id}`}
					className="text-sm text-primary underline"
				>
					Open lesson messages
				</Link>
			</section>
			<DevicePreview />
			<section className="space-y-2 rounded-xl border border-border bg-card p-5">
				<h2 className="text-xl">Lesson support</h2>
				{room.ownStatement && (
					<p className="wrap-anywhere">
						Your report · {room.ownStatement.detail}
					</p>
				)}
				{room.otherReported && <p>The other participant submitted a report.</p>}
				{room.pending && <p>Awaiting staff review.</p>}
				{room.decision && (
					<p className="wrap-anywhere">Staff review · {room.decision}</p>
				)}
				{room.canReport && !room.ownStatement && <LessonIssueForm id={id} />}
				{!room.canReport && !room.ownStatement && !room.otherReported && (
					<p className="text-sm text-muted-foreground">
						Lesson reporting opens with check-in for confirmed bookings.
					</p>
				)}
			</section>
		</div>
	);
}
