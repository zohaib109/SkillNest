import { TutorProfileForm } from "@/components/tutors/tutor-profile-form";
import { requireRole } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function TutorProfilePage() {
	const session = await requireRole("tutor");
	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl tracking-tight text-foreground">
					Tutor Profile
				</h1>
				<p className="mt-1 text-muted-foreground">
					Complete your profile and submit it for review. Only approved profiles
					appear in tutor search.
				</p>
			</div>
			<TutorProfileForm initial={profile} />
		</div>
	);
}
