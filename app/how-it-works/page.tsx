import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function HowItWorksPage() {
	const session = await getSession();
	const user = session?.user ?? null;

	return (
		<main className="flex-1 bg-background">
			{/* Page Header */}
			<section className="bg-white border-b border-border py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
					<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary mx-auto">
						⚙️ Process Guide
					</span>
					<h1 className="text-4xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-5xl">
						How SkillNest Works
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Explore how our structured, transactional virtual marketplace
						operates for both students seeking knowledge and expert instructors
						looking to share it.
					</p>
				</div>
			</section>

			{/* Comparative Grid */}
			<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
					{/* For Students Column */}
					<div className="flex flex-col gap-8 rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-2xs">
						<div className="flex flex-col gap-3">
							<span className="text-xs font-semibold uppercase tracking-wider text-primary">
								For Learners
							</span>
							<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
								The Student Journey
							</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								Unlock personalized academic success and practical tech
								instruction. Find and book lessons on your schedule without
								packages.
							</p>
						</div>

						<hr className="border-border/60" />

						{/* Steps */}
						<div className="flex flex-col gap-6">
							{[
								{
									num: "1",
									title: "Register & Access Tutors",
									desc: "Create your student account. Once logged in, search the verified tutor directory, filter by subjects, hourly rate, and calendar availability.",
								},
								{
									num: "2",
									title: "Book Single Lessons",
									desc: "Choose a tutor and select an open time slot. Purchase a single, individual hour using our secure checkout—no bulk packages required.",
								},
								{
									num: "3",
									title: "Join the Classroom",
									desc: "When it is time for your lesson, click 'Join' in your dashboard. Attend a face-to-face HD audio-video session directly inside your browser.",
								},
							].map((step) => (
								<div key={step.num} className="flex gap-4">
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{step.num}
									</span>
									<div className="flex flex-col gap-1">
										<h3 className="font-semibold text-foreground text-base">
											{step.title}
										</h3>
										<p className="text-sm leading-relaxed text-muted-foreground">
											{step.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* For Tutors Column */}
					<div className="flex flex-col gap-8 rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-2xs">
						<div className="flex flex-col gap-3">
							<span className="text-xs font-semibold uppercase tracking-wider text-primary">
								For Instructors
							</span>
							<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
								The Tutor Journey
							</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								Build a virtual tutoring business. Choose what you teach,
								determine your hourly rate, and receive secure manual
								administrative payouts.
							</p>
						</div>

						<hr className="border-border/60" />

						{/* Steps */}
						<div className="flex flex-col gap-6">
							{[
								{
									num: "1",
									title: "Submit Profile Vetting",
									desc: "Register a Tutor account and set your subject areas, rates, and availability. Admin moderation reviews and approves new profiles.",
								},
								{
									num: "2",
									title: "Receive Lesson Bookings",
									desc: "Students select your open slots and book lessons. Every booking is paid in advance and logged directly onto your tutor dashboard.",
								},
								{
									num: "3",
									title: "Teach & Cash Out",
									desc: "Teach using our built-in video system (Agora). Keep your earnings and request secure manual payouts managed directly by SkillNest staff.",
								},
							].map((step) => (
								<div key={step.num} className="flex gap-4">
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{step.num}
									</span>
									<div className="flex flex-col gap-1">
										<h3 className="font-semibold text-foreground text-base">
											{step.title}
										</h3>
										<p className="text-sm leading-relaxed text-muted-foreground">
											{step.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Call to Action Banner */}
			<section className="bg-white border-t border-border py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 items-center">
					<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
						Unlock your potential with SkillNest
					</h2>
					<p className="max-w-xl text-base text-muted-foreground">
						Join our calm, focused academic community today as a student looking
						to learn or an expert tutor looking to share your skills.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						{user ? (
							<Link
								href="/dashboard"
								className={buttonVariants({
									variant: "default",
									size: "lg",
									className: "rounded-full px-8",
								})}
							>
								Go to Dashboard
							</Link>
						) : (
							<>
								<Link
									href="/sign-up"
									className={buttonVariants({
										variant: "default",
										size: "lg",
										className: "rounded-full px-8",
									})}
								>
									Sign Up as Student
								</Link>
								<Link
									href="/become-a-tutor"
									className={buttonVariants({
										variant: "outline",
										size: "lg",
										className:
											"rounded-full px-8 border-primary text-primary hover:bg-primary/5",
									})}
								>
									Become a Tutor
								</Link>
							</>
						)}
					</div>
				</div>
			</section>
		</main>
	);
}
