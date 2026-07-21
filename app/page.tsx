import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function Home() {
	const session = await getSession();
	const user = session?.user ?? null;

	return (
		<main className="flex-1 bg-background">
			{/* ── Hero Section ── */}
			<section className="relative overflow-hidden bg-background">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
						{/* Left: Copy */}
						<div className="flex flex-col gap-8">
							<div className="flex flex-col gap-5">
								<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
									✨ A Premium Learning Space
								</span>
								<h1 className="text-4xl leading-[1.1] tracking-tight font-extrabold font-[var(--font-heading)] text-foreground sm:text-5xl lg:text-6xl">
									Master academic and professional skills.
								</h1>
								<p className="max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
									Connect with hand-selected, verified tutors for personalized
									one-on-one virtual lessons. Reach your learning goals on your
									own schedule.
								</p>
							</div>

							{/* Dynamic Call to Action Buttons */}
							<div className="flex flex-col gap-3 sm:flex-row">
								{user ? (
									<>
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
										<Link
											href="/tutors"
											className={buttonVariants({
												variant: "outline",
												size: "lg",
												className:
													"rounded-full px-8 border-primary text-primary hover:bg-primary/5",
											})}
										>
											Browse Tutors
										</Link>
									</>
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
											Find Your Tutor
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

							{/* Trust Indicators */}
							<div className="flex items-center gap-4 pt-2">
								{/* Stars */}
								<div className="flex items-center gap-0.5">
									{["s1", "s2", "s3", "s4", "s5"].map((id, i) => (
										<svg
											key={id}
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="currentColor"
											className={i < 4 ? "text-amber-400" : "text-amber-300"}
											aria-hidden="true"
										>
											<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
										</svg>
									))}
								</div>
								<span className="text-sm text-muted-foreground font-medium">
									Trusted by 10,000+ students
								</span>
								{/* Avatars */}
								<div className="flex -space-x-2">
									{["S", "A", "M"].map((initial, i) => (
										<div
											key={initial}
											className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-xs font-semibold text-primary"
											style={{ zIndex: 3 - i }}
										>
											{initial}
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Right: Hero Image */}
						<div className="relative hidden lg:block">
							<div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-lg">
								<Image
									src="/hero-student.jpg"
									alt="Student studying in a cozy environment"
									fill
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover"
									priority
								/>
								{/* Fallback gradient if no image */}
								<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/15" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── Why SkillNest? ── */}
			<section className="border-t border-border bg-white py-20 sm:py-28">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-4xl">
							A Calmer, More Personalized Learning Experience
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							We reject standard fast-paced lesson mills. SkillNest is built for
							focused growth, connection, and long-term skill retention.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								icon: "🎯",
								title: "One-on-One Focus",
								description:
									"Every lesson is custom-built for your individual learning path. Learn at your own pace without classroom distractions.",
							},
							{
								icon: "🛡️",
								title: "Verified Quality",
								description:
									"All tutors undergo credential vetting and manual admin validation before hosting private lessons.",
							},
							{
								icon: "⏳",
								title: "No Subscriptions",
								description:
									"Book single lessons whenever you need them. No forced packages, billing commitments, or lock-in contracts.",
							},
							{
								icon: "💻",
								title: "Integrated Classroom",
								description:
									"Attend interactive lessons with native high-definition video, audio, and screen sharing powered by Agora.",
							},
						].map((benefit) => (
							<div
								key={benefit.title}
								className="flex flex-col gap-3 rounded-2xl border border-border p-6 bg-background/50 hover:shadow-xs transition-shadow duration-200"
							>
								<span className="text-3xl">{benefit.icon}</span>
								<h3 className="text-lg font-semibold text-foreground">
									{benefit.title}
								</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{benefit.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Subjects Banner ── */}
			<section className="border-t border-border bg-background py-16 sm:py-20">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="rounded-3xl border border-border bg-white p-8 sm:p-12 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
						<div className="flex flex-col gap-3 max-w-xl text-left">
							<span className="text-xs font-semibold uppercase tracking-wider text-primary">
								Curriculum catalog
							</span>
							<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
								What can you learn on SkillNest?
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								From foundational language acquisition and secondary school
								subjects to advanced computer science and college prep, explore
								our catalog of categories.
							</p>
						</div>
						<div>
							<Link
								href="/subjects"
								className={buttonVariants({
									variant: "default",
									size: "lg",
									className: "rounded-full px-8 shrink-0 whitespace-nowrap",
								})}
							>
								Explore Our Subjects
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ── How it Works ── */}
			<section className="border-t border-border bg-white py-20 sm:py-24">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<h2 className="mb-4 text-center text-3xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-4xl">
						How SkillNest Works
					</h2>
					<p className="mx-auto mb-14 max-w-2xl text-center text-lg text-muted-foreground">
						Three simple steps to unlock your full learning potential.
					</p>
					<div className="grid grid-cols-1 gap-10 md:grid-cols-3">
						{[
							{
								step: "01",
								title: "Create Account & Find Subjects",
								description:
									"Explore our subject catalog to see what we teach, then sign up to access the private tutor directory.",
							},
							{
								step: "02",
								title: "Schedule Your Lesson",
								description:
									"Pick a verified tutor, select a calendar slot, and book a single lesson. Safe checkout is processed instantly.",
							},
							{
								step: "03",
								title: "Attend in the Browser",
								description:
									"Join your customized one-on-one virtual classroom. Click, learn, and log off. Simple as that.",
							},
						].map((item) => (
							<div
								key={item.step}
								className="flex flex-col items-center text-center md:items-start md:text-left"
							>
								<span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-[var(--font-heading)] text-lg font-extrabold text-primary">
									{item.step}
								</span>
								<h3 className="mb-2 text-xl font-semibold text-foreground">
									{item.title}
								</h3>
								<p className="text-base leading-relaxed text-muted-foreground">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── CTA Section ── */}
			<section className="border-t border-border bg-primary py-16 sm:py-20">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center gap-6 text-center">
						<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-primary-foreground sm:text-4xl">
							Ready to start master learning?
						</h2>
						<p className="max-w-xl text-lg text-primary-foreground/80 leading-relaxed">
							Join our calm, focused learning community today. Gain the
							knowledge you need with expert individual guides.
						</p>
						<div className="flex flex-col gap-3 sm:flex-row">
							{user ? (
								<Link
									href="/dashboard"
									className={buttonVariants({
										variant: "secondary",
										size: "lg",
										className: "rounded-full px-8",
									})}
								>
									Open Dashboard
								</Link>
							) : (
								<>
									<Link
										href="/sign-up"
										className={buttonVariants({
											variant: "secondary",
											size: "lg",
											className: "rounded-full px-8",
										})}
									>
										Get Started Free
									</Link>
									<Link
										href="/become-a-tutor"
										className={buttonVariants({
											variant: "outline",
											size: "lg",
											className:
												"rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground px-8",
										})}
									>
										Become a Tutor
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* ── Footer ── */}
			<footer className="border-t border-border bg-background">
				<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="flex items-center gap-2">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-primary"
								aria-hidden="true"
							>
								<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
								<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
							</svg>
							<span className="font-[var(--font-heading)] text-sm font-extrabold text-foreground">
								SkillNest
							</span>
						</div>
						<p className="text-sm text-muted-foreground font-medium">
							&copy; {new Date().getFullYear()} SkillNest. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</main>
	);
}
