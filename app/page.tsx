import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function Home() {
	const session = await getSession();
	return (
		<main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 lg:py-20">
			<section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
				<div className="space-y-7">
					<p className="text-sm font-semibold text-primary">
						One-to-one university tutoring
					</p>
					<h1 className="max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-7xl">
						Where does your Python code stop making sense?
					</h1>
					<p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
						Bring a loop you can’t trace or a function that gives the wrong
						answer. Find a tutor who can work through the reasoning with you.
					</p>
					<div className="flex flex-wrap items-center gap-4">
						<Link
							href="/tutors?q=Python"
							className={buttonVariants({ variant: "default", size: "lg" })}
						>
							Explore Python tutors
						</Link>
						<Link
							href="/tutors"
							className="font-medium text-primary underline underline-offset-4"
						>
							Browse all tutors
						</Link>
					</div>
					{session && (
						<Link
							href="/dashboard"
							className="inline-block text-sm font-medium text-primary underline"
						>
							Open my dashboard
						</Link>
					)}
				</div>
				<div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted sm:aspect-[5/3] lg:aspect-[4/5]">
					<Image
						src="/hero-student.jpg"
						alt="Student working at a desk"
						fill
						priority
						sizes="(min-width: 1024px) 40vw, 100vw"
						className="object-cover"
					/>
				</div>
			</section>
			<section className="mt-14 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
				<div>
					<h2 className="text-2xl">Choose a lesson that fits</h2>
					<p className="mt-2 max-w-md text-muted-foreground">
						Compare the tutor’s approach, lesson total and next opening before
						you create an account.
					</p>
				</div>
				<div>
					<h2 className="text-2xl">Teach from Pakistan</h2>
					<p className="mt-2 max-w-md text-muted-foreground">
						Show students what you teach, choose your hours and set your rate.
					</p>
					<Link
						className="mt-3 inline-block font-medium text-primary underline"
						href="/become-a-tutor"
					>
						How to become a tutor
					</Link>
				</div>
			</section>
		</main>
	);
}
