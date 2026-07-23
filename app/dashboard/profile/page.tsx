import { TutorOnboardingForm } from "@/components/tutors/tutor-onboarding-form";
import { requireRole } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function TutorProfilePage() {
	const session = await requireRole("tutor");
	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-extrabold tracking-tight text-foreground font-[var(--font-heading)]">
					Tutor Profile & Availability
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage your headline, bio, hourly rate, subjects, and weekly teaching
					availability.
				</p>
			</div>
			<TutorOnboardingForm initial={profile} />
		</div>
	);
}
