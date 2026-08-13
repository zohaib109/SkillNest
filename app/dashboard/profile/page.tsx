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
					Tutor Profile
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage your public headline, bio, rate, subjects, languages, and
					lesson preferences.
				</p>
			</div>
			<TutorProfileForm initial={profile} />
		</div>
	);
}
