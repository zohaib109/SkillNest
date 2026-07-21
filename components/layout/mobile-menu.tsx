"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

type Role = "student" | "tutor" | "admin";

interface MobileMenuProps {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role?: string | null;
	} | null;
}

const roleLinks: Record<Role, { href: string; label: string }[]> = {
	student: [
		{ href: "/dashboard", label: "Dashboard Overview" },
		{ href: "/dashboard/bookings", label: "My Bookings" },
	],
	tutor: [
		{ href: "/dashboard", label: "Dashboard Overview" },
		{ href: "/dashboard/profile", label: "My Profile" },
		{ href: "/dashboard/availability", label: "Availability" },
	],
	admin: [
		{ href: "/dashboard", label: "Admin Overview" },
		{ href: "/dashboard/admin/tutors", label: "Manage Tutors" },
		{ href: "/dashboard/admin/bookings", label: "Bookings" },
		{ href: "/dashboard/admin/payouts", label: "Payouts" },
	],
};

export function MobileMenu({ user }: MobileMenuProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const role = (user?.role ?? "student") as Role;
	const links = user ? (roleLinks[role] ?? roleLinks.student) : [];

	const publicLinks = user
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

	async function handleSignOut() {
		setIsOpen(false);
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/");
					router.refresh();
				},
			},
		});
	}

	return (
		<div className="md:hidden">
			{/* Hamburger Toggle Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-foreground hover:bg-muted cursor-pointer transition-all outline-none"
				aria-label="Toggle navigation menu"
				aria-expanded={isOpen}
			>
				{isOpen ? (
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				) : (
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				)}
			</button>

			{/* Fullscreen Mobile Drawer Overlay */}
			{isOpen && (
				<div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-white border-t border-border p-6 flex flex-col gap-6 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
					{/* Public Links */}
					<div className="flex flex-col gap-1">
						<span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
							Navigation
						</span>
						{publicLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground transition-all hover:bg-muted"
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Logged in section */}
					{user ? (
						<div className="flex flex-col gap-5 border-t border-border/80 pt-6 mt-2">
							{/* User Profile */}
							<div className="flex items-center gap-3 px-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary overflow-hidden border border-primary/20">
									{user.image ? (
										// biome-ignore lint/performance/noImgElement: OAuth dynamic user avatars require raw img to avoid next/image domain errors
										<img
											src={user.image}
											alt={user.name}
											className="h-full w-full object-cover"
										/>
									) : (
										(user.name?.charAt(0)?.toUpperCase() ?? "U")
									)}
								</div>
								<div className="flex flex-col gap-0.5 min-w-0">
									<p className="text-sm font-semibold text-foreground truncate">
										{user.name}
									</p>
									<p className="text-2xs text-muted-foreground truncate">
										{user.email}
									</p>
								</div>
								<span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-2xs font-medium capitalize text-primary">
									{role}
								</span>
							</div>

							{/* Role specific dashboard links */}
							<div className="flex flex-col gap-1">
								<span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
									Dashboard
								</span>
								{links.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										onClick={() => setIsOpen(false)}
										className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground transition-all hover:bg-muted"
									>
										{link.label}
									</Link>
								))}
							</div>

							{/* Logout */}
							<button
								type="button"
								onClick={handleSignOut}
								className="mt-4 w-full rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 cursor-pointer"
							>
								Sign Out
							</button>
						</div>
					) : (
						/* Guest buttons */
						<div className="flex flex-col gap-3 border-t border-border/80 pt-6 mt-auto">
							<Link
								href="/sign-in"
								onClick={() => setIsOpen(false)}
								className={buttonVariants({
									variant: "default",
									size: "lg",
									className: "w-full rounded-xl py-3 justify-center",
								})}
							>
								Log In
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
