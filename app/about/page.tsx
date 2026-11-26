import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Page() {
	return (
		<main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-5 py-14 sm:py-20">
			<header>
				<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
					About SkillNest
				</h1>
				<p className="mt-5 text-lg leading-relaxed text-muted-foreground">
					SkillNest connects adult university students with Pakistan-based
					tutors for focused, one-to-one academic help.
				</p>
			</header>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">What a lesson is for</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Bring a problem you want to understand. A tutor can ask you to trace
					it, explain your assumptions and try a related example on your own.
					Introductory Python is our first focus.
				</p>
			</section>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">What profile review means</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Staff review the tutor’s profile before it appears in discovery.
					Experience and qualifications in the biography are described by the
					tutor. Look for a teaching example that fits your goal.
				</p>
			</section>
			<Link href="/tutors" className={buttonVariants({ variant: "default" })}>
				Browse tutors
			</Link>
		</main>
	);
}
