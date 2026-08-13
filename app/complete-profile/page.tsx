import { redirect } from "next/navigation";
import { AvailabilityEditor } from "@/components/tutors/availability-editor";
import { TutorProfileForm } from "@/components/tutors/tutor-profile-form";
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

				<div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
					<TutorProfileForm initial={profile} />
				</div>

				<div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
					<div>
						<h2 className="text-xl font-bold tracking-tight text-foreground">
							Weekly availability
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Save at least one teaching slot before submitting your profile for
							admin review.
						</p>
					</div>
					<AvailabilityEditor initial={profile} />
				</div>
			</div>
		</main>
	);
}
