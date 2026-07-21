import Link from "next/link";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export async function Navbar() {
	const session = await getSession();
	const user = session?.user ?? null;

	const navLinks = user
		? [
				{ href: "/tutors", label: "Find a Tutor" },
				{ href: "/how-it-works", label: "How it Works" },
				{ href: "/about", label: "About" },
			]
		: [
				{ href: "/subjects", label: "Subjects We Teach" },
				{ href: "/how-it-works", label: "How it Works" },
				{ href: "/about", label: "About" },
				{ href: "/become-a-tutor", label: "Become a Tutor" },
			];

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Left Logo */}
				<Link href="/" className="flex items-center gap-2">
					<svg
						width="28"
						height="28"
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
					<span className="text-xl font-extrabold tracking-tight font-[var(--font-heading)] text-foreground">
						SkillNest
					</span>
				</Link>

				{/* Center Desktop Links */}
				<ul className="hidden md:flex items-center gap-8">
					{navLinks.map((link) => (
						<li key={link.href}>
							<Link
								href={link.href}
								className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								{link.label}
							</Link>
						</li>
					))}
				</ul>

				{/* Right Side Controls */}
				<div className="flex items-center gap-3">
					<ThemeToggle />
					{/* Desktop Auth States */}
					<div className="hidden md:flex items-center gap-3">
						{user ? (
							<UserMenu user={user} />
						) : (
							<Link
								href="/sign-in"
								className={buttonVariants({
									variant: "default",
									size: "sm",
								})}
							>
								Log In
							</Link>
						)}
					</div>

					{/* Mobile Menu (Drawer Toggle + Hamburger) */}
					<MobileMenu user={user} />
				</div>
			</nav>
		</header>
	);
}
