import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const subjects = [
	"Mathematics",
	"Physics",
	"English",
	"Computer Science",
	"Chemistry",
	"Biology",
	"Music",
	"Art",
];

export default function Home() {
	return (
		<main className="flex-1">
			{/* ── Hero Section ── */}
			<section className="relative overflow-hidden bg-background">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
						{/* Left: Copy */}
						<div className="flex flex-col gap-8">
							<div className="flex flex-col gap-5">
								<h1 className="text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
									Find Your Perfect Tutor
								</h1>
								<p className="max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
									Connect with expert tutors, personalized to your goals. Learn
									faster, achieve more.
								</p>
							</div>

							{/* Search Bar */}
							<div className="flex items-center gap-0 rounded-full border border-border bg-white p-1.5 shadow-sm">
								<div className="flex flex-1 items-center gap-2 pl-4">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="shrink-0 text-muted-foreground"
										aria-hidden="true"
									>
										<circle cx="11" cy="11" r="8" />
										<path d="m21 21-4.3-4.3" />
									</svg>
									<input
										type="text"
										placeholder="Search subjects, skills, or tutor name..."
										className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									/>
								</div>
								<Link
									href="/tutors"
									className={buttonVariants({
										variant: "default",
										size: "default",
										className: "rounded-full px-6",
									})}
								>
									Find a Tutor
								</Link>
							</div>

							{/* Trust Indicators */}
							<div className="flex items-center gap-4">
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
								<span className="text-sm text-muted-foreground">
									Trusted by 10,000+ students
								</span>
								{/* Avatars */}
								<div className="flex -space-x-2">
									{["S", "A", "M"].map((initial, i) => (
										<div
											key={initial}
											className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-xs font-medium text-primary"
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
							<div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-xl">
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

			{/* ── Popular Subjects ── */}
			<section className="border-t border-border bg-white">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
					<h2 className="mb-10 text-center text-3xl tracking-tight text-foreground sm:text-4xl">
						Popular Subjects
					</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{subjects.map((subject) => (
							<Link
								key={subject}
								href={`/tutors?subject=${encodeURIComponent(subject)}`}
								className="group flex items-center justify-center rounded-2xl border border-border bg-background px-6 py-5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
							>
								<span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
									{subject}
								</span>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* ── How it Works ── */}
			<section className="border-t border-border bg-background">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<h2 className="mb-4 text-center text-3xl tracking-tight text-foreground sm:text-4xl">
						How SkillNest Works
					</h2>
					<p className="mx-auto mb-14 max-w-2xl text-center text-lg text-muted-foreground">
						Three simple steps to start learning with the best tutors.
					</p>
					<div className="grid grid-cols-1 gap-10 md:grid-cols-3">
						{[
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
						].map((item) => (
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
				</div>
			</section>

			{/* ── CTA Section ── */}
			<section className="border-t border-border bg-primary">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
					<div className="flex flex-col items-center gap-6 text-center">
						<h2 className="text-3xl tracking-tight text-primary-foreground sm:text-4xl">
							Ready to start learning?
						</h2>
						<p className="max-w-xl text-lg text-primary-foreground/80">
							Join thousands of students who found their perfect tutor on
							SkillNest.
						</p>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Link
								href="/sign-up"
								className={buttonVariants({
									variant: "secondary",
									size: "lg",
									className: "rounded-full",
								})}
							>
								Get Started Free
							</Link>
							<Link
								href="/tutors"
								className={buttonVariants({
									variant: "outline",
									size: "lg",
									className:
										"rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
								})}
							>
								Browse Tutors
							</Link>
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
						<p className="text-sm text-muted-foreground">
							&copy; {new Date().getFullYear()} SkillNest. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</main>
	);
}
