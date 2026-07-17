export default function AboutPage() {
	return (
		<main className="flex-1">
			<section className="bg-background">
				<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="flex flex-col gap-6">
						<h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
							About SkillNest
						</h1>
						<p className="text-lg leading-relaxed text-muted-foreground">
							SkillNest is a tutoring marketplace that connects students with
							expert tutors for personalized, one-on-one lessons. Our mission is
							to make high-quality education accessible to everyone, anywhere.
						</p>
						<p className="text-lg leading-relaxed text-muted-foreground">
							Whether you&apos;re preparing for exams, learning a new skill, or
							exploring a creative passion, SkillNest helps you find the perfect
							tutor tailored to your goals, schedule, and budget.
						</p>
						<div className="mt-4 rounded-2xl border border-dashed border-border bg-white p-12 text-center">
							<p className="text-sm text-muted-foreground">
								More about our story and team coming soon.
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
