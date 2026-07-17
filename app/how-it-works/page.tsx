import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const steps = [
	{
		step: "01",
		title: "Search & Discover",
		description:
			"Browse our curated directory of expert tutors. Filter by subject, price, language, and availability.",
	},
	{
		step: "02",
		title: "Book a Lesson",
		description:
			"Pick a time slot that works for you and book a single lesson. No commitments or packages required.",
	},
	{
		step: "03",
		title: "Learn & Grow",
		description:
			"Join your live lesson directly in the browser. Rate your tutor and book again anytime.",
	},
];

export default function HowItWorksPage() {
	return (
		<main className="flex-1">
			<section className="bg-background">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="flex flex-col items-center gap-6 text-center">
						<h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
							How SkillNest Works
						</h1>
						<p className="max-w-2xl text-lg text-muted-foreground">
							Three simple steps to start learning with the best tutors.
						</p>
					</div>

					<div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
						{steps.map((item) => (
							<div
								key={item.step}
								className="flex flex-col items-center text-center md:items-start md:text-left"
							>
								<span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-[var(--font-heading)] text-lg font-extrabold text-primary">
									{item.step}
								</span>
								<h3 className="mb-2 text-xl text-foreground">{item.title}</h3>
								<p className="text-base leading-relaxed text-muted-foreground">
									{item.description}
								</p>
							</div>
						))}
					</div>

					<div className="mt-16 flex justify-center">
						<Link
							href="/sign-up"
							className={buttonVariants({
								variant: "default",
								size: "lg",
								className: "rounded-full",
							})}
						>
							Get Started Free
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
