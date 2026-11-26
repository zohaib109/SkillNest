import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";
export default async function Page() {
	const session = await getSession();
	return (
		<main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-5 py-14 sm:py-20">
			<header>
				<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
					Teach a subject you know well
				</h1>
				<p className="mt-5 text-lg leading-relaxed text-muted-foreground">
					Help adult university students work through a specific problem. The
					pilot is recruiting tutors in Pakistan with experience teaching
					introductory Python.
				</p>
			</header>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Show how you teach</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Describe your experience and topics you can explain clearly. An
					optional YouTube or Vimeo introduction can show how you guide a
					student through an example.
				</p>
			</section>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Set your own lesson lengths and rate</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					Choose your timezone and available hours. Offering a 30-minute lesson
					lets a student meet you in a shorter paid session. Unpaid
					demonstrations are optional and are outside the current booking flow.
				</p>
			</section>
			<section className="border-t border-border pt-5">
				<h2 className="text-2xl">Choose who can find you</h2>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					You can keep a reviewed profile visible to verified students, or opt
					into a public listing. Staff review the profile and requested
					visibility before publication. Live payments and tutor payouts are
					pending.
				</p>
			</section>
			<Link
				href={session ? "/dashboard" : "/sign-in?tab=signup&role=tutor"}
				className={buttonVariants({ variant: "default" })}
			>
				{session ? "Open my dashboard" : "Create a tutor account"}
			</Link>
		</main>
	);
}
