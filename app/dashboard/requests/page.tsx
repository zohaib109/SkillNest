import { TutorRequestList } from "@/components/dashboard/tutor-request-list";
import { getLessonRequestsForTutor } from "@/lib/lesson-requests";
import { requireRole } from "@/lib/permissions";

export default async function TutorRequestsPage() {
	const session = await requireRole("tutor");
	const requests = await getLessonRequestsForTutor(session.user.id);
	const pendingCount = requests.filter(
		(request) => request.status === "pending",
	).length;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						Teaching workspace
					</p>
					<h1 className="mt-1 text-3xl tracking-tight text-foreground">
						Lesson requests
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Review a student's learning goal, then accept or decline the
						request.
					</p>
				</div>
				{pendingCount > 0 && (
					<span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
						{pendingCount} awaiting a decision
					</span>
				)}
			</header>
			<TutorRequestList requests={requests} />
		</div>
	);
}
