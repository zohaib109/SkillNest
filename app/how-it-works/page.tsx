import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Page() {
	return (
		<main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-5 py-14 sm:py-20">
			<header>
				<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
					How lessons work
				</h1>
				<p className="mt-5 text-lg leading-relaxed text-muted-foreground">
					Start with a topic you want to understand and compare individual
					lessons at your own pace.
				</p>
			</header>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Find a tutor</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Browse public profiles, compare subjects and languages, and preview an
					available time. Choose a currency when comparing hourly rates.
				</p>
			</section>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Choose a time</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Each lesson length has its own total. Sign in as a verified student to
					choose a time and reserve it briefly. An unpaid hold expires
					automatically.
				</p>
			</section>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Prepare for the lesson</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Describe what you have tried and where you got stuck. You can see your
					reservation in My Bookings. Checkout is currently available only in
					the local test environment.
				</p>
			</section>
			<Link href="/tutors" className={buttonVariants({ variant: "default" })}>
				Browse tutors
			</Link>
		</main>
	);
}
