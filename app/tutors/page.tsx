import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function TutorsPage() {
	return (
		<main className="flex-1">
			<section className="bg-background">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="flex flex-col items-center gap-6 text-center">
						<h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
							Find a Tutor
						</h1>
						<p className="max-w-2xl text-lg text-muted-foreground">
							Browse our curated directory of expert tutors. Filter by subject,
							price, language, and availability.
						</p>
						<div className="rounded-2xl border border-dashed border-border bg-white p-12">
							<p className="text-sm text-muted-foreground">
								Tutor directory with search and filters coming in Phase 3.
							</p>
						</div>
						<Link
							href="/sign-up"
							className={buttonVariants({
								variant: "default",
								size: "lg",
								className: "rounded-full",
							})}
						>
							Sign Up to Get Notified
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
