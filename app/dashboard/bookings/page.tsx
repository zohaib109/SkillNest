import Link from "next/link";
import { getLessonRequestsForStudent } from "@/lib/lesson-requests";
import { requireRole } from "@/lib/permissions";

const statusStyles = {
	pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	declined: "bg-destructive/10 text-destructive",
};

export default async function StudentBookingsPage() {
	const session = await requireRole("student");
	const requests = await getLessonRequestsForStudent(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						Learning workspace
					</p>
					<h1 className="mt-1 text-3xl tracking-tight text-foreground">My lesson requests</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Track your requests while scheduling and payment are still kept out of the MVP.
					</p>
				</div>
				<Link href="/tutors" className="w-fit text-sm font-semibold text-primary hover:underline">
					Find another tutor →
				</Link>
			</header>

			{requests.length ? (
				<div className="flex flex-col gap-3">
					{requests.map((request) => (
						<article key={request.id} className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h2 className="text-base font-semibold text-foreground">{request.tutorName}</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										{request.subject} · {request.duration} minutes
									</p>
								</div>
								<span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}>
									{request.status}
								</span>
							</div>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								Preferred time: {request.preferredSchedule}
							</p>
							<p className="mt-2 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-foreground">{request.message}</p>
						</article>
					))}
				</div>
			) : (
				<div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
					<p className="text-sm text-muted-foreground">You have not sent a lesson request yet.</p>
					<Link href="/tutors" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
						Browse approved tutors →
					</Link>
				</div>
			)}
		</div>
	);
}
