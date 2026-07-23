import { redirect } from "next/navigation";
import { TutorOnboardingForm } from "@/components/tutors/tutor-onboarding-form";
import { getSession } from "@/lib/auth-server";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function CompleteProfilePage() {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in?callbackUrl=/complete-profile");
	}

	// Only tutors undergo the tutor onboarding profile setup flow
	if (session.user.role !== "tutor") {
		redirect("/dashboard");
	}

	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<main className="flex-1 bg-background py-10 sm:py-16">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
				{/* Page Header */}
				<div className="flex flex-col gap-2 text-center sm:text-left border-b border-border/80 pb-6">
					<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
						🎓 Tutor Onboarding
					</span>
					<h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-[var(--font-heading)]">
						Set Up Your Teaching Profile
					</h1>
					<p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
						Complete your professional headline, bio, hourly rate, subjects, and
						weekly teaching availability to prepare your SkillNest tutor
						profile.
					</p>
				</div>

				<TutorOnboardingForm initial={profile} />
			</div>
		</main>
	);
}
