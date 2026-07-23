"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Role = "student" | "tutor" | "admin";

interface UserMenuProps {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role?: string | null;
	};
}

const roleLinks: Record<Role, { href: string; label: string }[]> = {
	student: [
		{ href: "/dashboard", label: "Dashboard Overview" },
		{ href: "/dashboard/bookings", label: "My Bookings" },
	],
	tutor: [
		{ href: "/dashboard", label: "Dashboard Overview" },
		{ href: "/dashboard/profile", label: "Edit Profile" },
		{ href: "/dashboard/availability", label: "Availability Settings" },
		{ href: "/dashboard/intro-video", label: "Intro Video" },
		{ href: "/dashboard/requests", label: "Lesson Requests" },
		{ href: "/dashboard/earnings", label: "Earnings & Activity" },
	],
	admin: [
		{ href: "/dashboard", label: "Admin Overview" },
		{ href: "/admin", label: "Tutor Review" },
		{ href: "/dashboard/admin/bookings", label: "All Bookings" },
		{ href: "/dashboard/admin/payouts", label: "Process Payouts" },
	],
};

export function UserMenu({ user }: UserMenuProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const role = (user.role ?? "student") as Role;
	const links = roleLinks[role] ?? roleLinks.student;
	const firstLetter = user.name?.charAt(0)?.toUpperCase() ?? "U";

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
		<div className="relative" ref={menuRef}>
			{/* Trigger Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-full border border-border bg-white p-1 pr-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary overflow-hidden border border-primary/20">
					{user.image ? (
						// biome-ignore lint/performance/noImgElement: OAuth dynamic user avatars require raw img to avoid next/image domain errors
						<img
							src={user.image}
							alt={user.name}
							className="h-full w-full object-cover"
						/>
					) : (
						firstLetter
					)}
				</div>
				<span className="hidden sm:inline text-sm font-medium text-foreground max-w-[100px] truncate">
					{user.name}
				</span>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className={cn(
						"text-muted-foreground transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-150">
					{/* User Profile Summary */}
					<div className="px-3 py-2.5 border-b border-border/60">
						<p className="text-sm font-semibold text-foreground truncate">
							{user.name}
						</p>
						<p className="text-xs text-muted-foreground truncate mb-1.5">
							{user.email}
						</p>
						<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-2xs font-medium capitalize text-primary border border-primary/10">
							{role}
						</span>
					</div>

					{/* Navigation Links */}
					<div className="py-1.5">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className="flex items-center rounded-xl px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-all font-medium"
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Sign Out Button */}
					<div className="border-t border-border/60 pt-1.5">
						<button
							type="button"
							onClick={handleSignOut}
							className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-all font-medium cursor-pointer"
						>
							Sign Out
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
