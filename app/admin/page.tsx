import { TutorModerationList } from "@/components/dashboard/admin/tutor-moderation-list";
import { requireAdmin } from "@/lib/permissions";
import { getTutorProfilesByStatus } from "@/lib/tutors";

/**
 * Deliberately unlinked: admin access is granted only to the operations
 * allowlist in requireAdmin, never through public account registration.
 */
export default async function AdminPage() {
	await requireAdmin();
	const pendingProfiles = await getTutorProfilesByStatus("pending_review");

	return (
		<main className="flex-1 bg-background py-8 sm:py-10">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
				<header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
							Private operations
						</p>
						<h1 className="mt-1 text-3xl tracking-tight text-foreground">
							Tutor review queue
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Approve only profiles ready to be visible to students.
						</p>
					</div>
					<span className="inline-flex w-fit items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
						{pendingProfiles.length} awaiting review
					</span>
				</header>

				<TutorModerationList profiles={pendingProfiles} />
			</div>
		</main>
	);
}
