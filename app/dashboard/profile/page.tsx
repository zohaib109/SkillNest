import { TutorProfileForm } from "@/components/tutors/tutor-profile-form";
import { requireRole } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function TutorProfilePage() {
	const session = await requireRole("tutor");
	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-extrabold tracking-tight text-foreground font-[var(--font-heading)]">
				Edit teaching profile
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
				Keep your public profile, rate, teaching subjects, and profile photo current.
				</p>
			</div>
			<div className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6">
				<TutorProfileForm initial={profile} />
			</div>
		</div>
	);
}
