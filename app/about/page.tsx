import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function AboutPage() {
	const session = await getSession();
	const user = session?.user ?? null;

	return (
		<main className="flex-1 bg-background">
			{/* Page Header */}
			<section className="bg-white border-b border-border py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
					<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary mx-auto">
						🌱 Our Philosophy
					</span>
					<h1 className="text-4xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-5xl">
						About SkillNest
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						SkillNest is a transactional tutoring marketplace designed to offer
						a calmer, more focused, and highly personal approach to online
						learning.
					</p>
				</div>
			</section>

			{/* Mission & Vision Section */}
			<section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 flex flex-col gap-16">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
					<div className="flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-foreground font-[var(--font-heading)]">
							Our Mission
						</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							To make high-quality, personalized instruction accessible and
							stress-free. We believe that learning shouldn&apos;t be
							industrialized into massive video playlists or high-pressure
							course bundles. Instead, we connect eager students with expert
							tutors for direct, human-to-human mentorship.
						</p>
					</div>
					<div className="flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-foreground font-[var(--font-heading)]">
							Our Vision
						</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							We envision a global education network where teachers are fairly
							compensated for their specialized knowledge and students have the
							complete freedom to buy single lessons to solve specific
							challenges. By centering operations around trust and transparency,
							we build a space where skills are masterfully retained.
						</p>
					</div>
				</div>

				<hr className="border-border/60" />

				{/* Values Grid */}
				<div className="flex flex-col gap-8">
					<div className="text-center md:text-left">
						<h2 className="text-2xl font-bold text-foreground font-[var(--font-heading)] mb-2">
							Core Values
						</h2>
						<p className="text-sm text-muted-foreground max-w-lg">
							These four foundational principles guide every operational
							decisions we make at SkillNest.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						{[
							{
								title: "Quality Vetting",
								desc: "We reject the open-sign-up model. Every tutor on SkillNest is manually checked and approved by our team before they can take bookings, maintaining high standards for the community.",
							},
							{
								title: "Fair Compensation",
								desc: "Tutors set their own hourly rates and keep their earnings. We facilitate secure billing and hand-process tutor payouts to ensure reliability.",
							},
							{
								title: "Transactional Freedom",
								desc: "We completely reject subscription lock-ins or bulk lesson packs. Students pay for one lesson at a time, keeping learning affordable and flexible.",
							},
							{
								title: "Human Connection",
								desc: "We believe real learning happens in real-time, interactive dialogues. Our platform focuses entirely on browser-based, face-to-face video instruction.",
							},
						].map((value) => (
							<div
								key={value.title}
								className="rounded-2xl border border-border bg-white p-6 sm:p-8"
							>
								<h3 className="font-semibold text-foreground text-base mb-2">
									{value.title}
								</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{value.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Call to Action */}
			<section className="bg-white border-t border-border py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 items-center">
					<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
						Join our growing community
					</h2>
					<p className="max-w-xl text-base text-muted-foreground font-medium">
						Whether you want to learn languages, master calculus, write clean
						programming code, or share your tutoring credentials, get started
						today.
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
									Start Learning
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
