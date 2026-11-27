import Link from "next/link";
import { LessonRecap, RecapForm } from "@/components/dashboard/lesson-notes";
import { LocalTime } from "@/components/tutors/local-time";
import { listTutorLessons } from "@/lib/bookings";
import { requireVerifiedRole } from "@/lib/permissions";

export default async function TutorLessonsPage() {
	const session = await requireVerifiedRole("tutor");
	const lessons = await listTutorLessons(session.user.id);
	const now = new Date();
	const upcoming = lessons
		.filter(({ startsAt, status }) => startsAt >= now && status === "confirmed")
		.reverse();
	const history = lessons.filter(
		({ startsAt, status }) => startsAt < now || status !== "confirmed",
	);
	return (
		<div className="space-y-6">
			<h1 className="text-3xl tracking-tight">My Lessons</h1>
			{[
				{ title: "Upcoming lessons", items: upcoming },
				{ title: "Recent history", items: history },
			].map(({ title, items }) => (
				<section key={title} className="space-y-3">
					<h2 className="text-xl">{title}</h2>
					{items.length ? (
						<ul className="space-y-2">
							{items.map((lesson) => (
								<li
									key={String(lesson._id)}
									className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-border bg-white p-4"
								>
									<div>
										<p className="font-medium">
											<LocalTime value={lesson.startsAt.toISOString()} /> ·{" "}
											{lesson.duration} min
										</p>
										<p className="break-all text-xs text-muted-foreground">
											Booking {String(lesson._id)}
										</p>
									</div>
									<p className="text-sm capitalize">
										{lesson.status}
										{lesson.paymentMode === "sandbox" && " · sandbox"}
									</p>
									{lesson.goal &&
										(lesson.status === "confirmed" ||
											lesson.status === "completed") && (
											<p className="w-full break-words text-sm">
												<strong>Student’s goal</strong> · {lesson.goal}
											</p>
										)}
									{(lesson.status === "confirmed" ||
										lesson.status === "completed") &&
										(lesson.recap ? (
											<LessonRecap
												recap={{
													practised: lesson.recap.practised,
													exercise: lesson.recap.exercise,
													resource: lesson.recap.resource,
												}}
												response={lesson.practiceResponse}
											/>
										) : (
											lesson.endsAt <= now && (
												<RecapForm id={String(lesson._id)} />
											)
										))}
									{lesson.confirmedAt && (
										<Link
											className="text-sm font-medium text-primary underline"
											href={`/dashboard/messages/${String(lesson._id)}`}
										>
											Lesson messages
											{(lesson.studentSent ?? 0) > (lesson.tutorRead ?? 0) &&
												" · unread"}
										</Link>
									)}
									{lesson.confirmedAt && (
										<Link
											href={`/dashboard/room/${String(lesson._id)}`}
											className="text-sm font-medium text-primary underline"
										>
											{lesson.endsAt <= now &&
											lesson.paymentMode === "sandbox" &&
											(lesson.status === "confirmed" ||
												lesson.status === "completed")
												? "Lesson confirmation and support"
												: "Lesson room and support"}
										</Link>
									)}
								</li>
							))}
						</ul>
					) : (
						<p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
							No lessons to show.
						</p>
					)}
				</section>
			))}
		</div>
	);
}
