import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function BecomeTutorPage() {
	const session = await getSession();
	const user = session?.user ?? null;

	return (
		<main className="flex-1 bg-background">
			{/* Hero Section */}
			<section className="bg-white border-b border-border py-16 sm:py-24 text-center">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 items-center">
					<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary mx-auto">
						🎓 Teach on SkillNest
					</span>
					<h1 className="text-4xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-5xl lg:text-6xl max-w-4xl">
						Share Your Knowledge. Inspire Others. Earn on Your Own Terms.
					</h1>
					<p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
						Join our premium online tutoring marketplace. Connect with global
						students, set your own hourly rates, teach from home, and work
						exactly when you want.
					</p>
					<div className="mt-4">
						{user ? (
							<Link
								href="/dashboard"
								className={buttonVariants({
									variant: "default",
									size: "lg",
									className: "rounded-full px-8",
								})}
							>
								Go to Your Dashboard
							</Link>
						) : (
							<Link
								href="/sign-in?tab=signup&role=tutor"
								className={buttonVariants({
									variant: "default",
									size: "lg",
									className: "rounded-full px-8",
								})}
							>
								Apply to Teach Now
							</Link>
						)}
					</div>
				</div>
			</section>

			{/* Benefits Grid */}
			<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center mb-16">
					<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-4xl">
						Why Teach on SkillNest?
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						We provide the tech, processing, and audience so you can focus
						entirely on what you do best: teaching.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{[
						{
							icon: "💰",
							title: "Set Your Own Rates",
							desc: "You have complete control over your worth. Set and adjust your hourly rate (USD) at any time. We charge a simple platform commission per lesson.",
						},
						{
							icon: "📅",
							title: "Flexible Hours",
							desc: "Work as much or as little as you like. Set your availability rules in our scheduling system, and students can only book slots that work for you.",
						},
						{
							icon: "🏦",
							title: "Reliable Manual Payouts",
							desc: "Never chase invoices again. Students pay in advance. Your earnings accumulate in your ledger, and admins process secure manual payouts upon request.",
						},
						{
							icon: "🛡️",
							title: "Vetted Classrooms",
							desc: "No spam or unqualified requests. Our platform moderates user behavior to ensure students are serious, respectful, and prepared to learn.",
						},
						{
							icon: "🔒",
							title: "Secure Web Tooling",
							desc: "Host lessons directly in your browser. Our built-in classroom runs high-fidelity video, audio, and screen sharing without needing desktop software.",
						},
						{
							icon: "🌍",
							title: "Global Reach",
							desc: "Access students from around the world. Expand your client base beyond your local area and build international tutoring credentials.",
						},
					].map((item) => (
						<div
							key={item.title}
							className="rounded-3xl border border-border bg-white p-6 sm:p-8 hover:shadow-xs transition-shadow duration-200"
						>
							<span className="text-3xl block mb-4">{item.icon}</span>
							<h3 className="font-semibold text-foreground text-base mb-2">
								{item.title}
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{item.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* How it works for tutors */}
			<section className="border-t border-border bg-white py-20 sm:py-24">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-4xl">
							How to Get Started
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Four quick steps to launch your virtual tutoring space.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						{[
							{
								step: "1",
								title: "Create Your Profile",
								desc: "Sign up and complete your profile. Add your professional headline, set your rate, define subjects, and add an intro video link.",
							},
							{
								step: "2",
								title: "Vetting & Approval",
								desc: "SkillNest admins review your profile content and biography. Once approved, your public tutor profile goes live in search catalogs.",
							},
							{
								step: "3",
								title: "Define Availability",
								desc: "Use the calendar manager to input your weekly teaching slots and select your fixed lesson duration options.",
							},
							{
								step: "4",
								title: "Teach & Earn",
								desc: "Accept booking requests from students. Deliver lessons inside our virtual classroom, and request manual admin cashouts.",
							},
						].map((item) => (
							<div
								key={item.step}
								className="flex flex-col items-center text-center"
							>
								<span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-[var(--font-heading)] text-lg font-extrabold text-primary">
									{item.step}
								</span>
								<h3 className="mb-2 text-base font-semibold text-foreground">
									{item.title}
								</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* FAQs Section */}
			<section className="border-t border-border bg-background py-20 sm:py-24">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-4xl">
							Frequently Asked Questions
						</h2>
					</div>

					<div className="flex flex-col gap-6">
						{[
							{
								q: "How do I get paid on SkillNest?",
								a: "When a student books and pays for a lesson, the funds are held securely. After you complete the browser-based virtual lesson, the earnings (minus platform fee) are credited to your wallet balance. You can request a manual payout from your dashboard, which is reviewed and processed directly to your bank account by our staff.",
							},
							{
								q: "Is there an application fee?",
								a: "No, applying to become a tutor on SkillNest is completely free. We only charge a platform commission on completed lessons to cover administrative costs, virtual classroom servers, and secure billing operations.",
							},
							{
								q: "What subjects can I tutor?",
								a: "You can tutor any subject listed in our subjects catalog, including secondary school academic courses, programming/technology languages, university-level mathematics, and world languages.",
							},
							{
								q: "Do I need specific software for lessons?",
								a: "No. You do not need to install Zoom, Skype, or Microsoft Teams. SkillNest includes a native, secure, browser-based video-audio classroom powered by Agora. All you need is a reliable internet connection, a webcam, and a microphone.",
							},
						].map((faq) => (
							<div
								key={faq.q}
								className="rounded-2xl border border-border bg-white p-6 sm:p-8"
							>
								<h3 className="font-semibold text-foreground text-base mb-2">
									{faq.q}
								</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{faq.a}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="border-t border-border bg-primary py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 items-center animate-fade-in">
					<h2 className="text-3xl font-bold tracking-tight font-[var(--font-heading)] text-primary-foreground sm:text-4xl">
						Start teaching today
					</h2>
					<p className="max-w-xl text-lg text-primary-foreground/80 leading-relaxed">
						Join our vetted team of professional guides. Reach more students and
						grow your virtual tutoring business.
					</p>
					<div>
						{user ? (
							<Link
								href="/dashboard"
								className={buttonVariants({
									variant: "secondary",
									size: "lg",
									className: "rounded-full px-8",
								})}
							>
								Go to Your Dashboard
							</Link>
						) : (
							<Link
								href="/sign-in?tab=signup&role=tutor"
								className={buttonVariants({
									variant: "secondary",
									size: "lg",
									className: "rounded-full px-8",
								})}
							>
								Apply to Teach Now
							</Link>
						)}
					</div>
				</div>
			</section>
		</main>
	);
}
