import { TutorModerationList } from "@/components/dashboard/admin/tutor-moderation-list";
import { requireRole } from "@/lib/permissions";
import { getAllTutorProfiles } from "@/lib/tutors";

export default async function AdminTutorsPage() {
	await requireRole("admin");
	const all = await getAllTutorProfiles();
	const pending = all.filter((p) => p.status === "pending_review");
	const others = all.filter((p) => p.status !== "pending_review");

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-3xl tracking-tight text-foreground">
					Manage Tutors
				</h1>
				<p className="mt-1 text-muted-foreground">
					Review and approve tutor applications. Only approved tutors appear in
					search.
				</p>
			</div>

			<section className="flex flex-col gap-4">
				<h2 className="text-xl text-foreground">
					Awaiting Review ({pending.length})
				</h2>
				<TutorModerationList profiles={pending} />
			</section>

			{others.length > 0 && (
				<section className="flex flex-col gap-4">
					<h2 className="text-xl text-foreground">All Tutors</h2>
					<TutorModerationList profiles={others} />
				</section>
			)}
		</div>
	);
}
