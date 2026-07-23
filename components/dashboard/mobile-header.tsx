"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Role = "student" | "tutor" | "admin";

const navItems: Record<Role, { href: string; label: string }[]> = {
	student: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/dashboard/bookings", label: "My Bookings" },
	],
	tutor: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/dashboard/profile", label: "Edit Profile" },
		{ href: "/dashboard/availability", label: "Availability" },
		{ href: "/dashboard/intro-video", label: "Intro Video" },
		{ href: "/dashboard/requests", label: "Lesson Requests" },
		{ href: "/dashboard/earnings", label: "Earnings & Activity" },
	],
	admin: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/admin", label: "Tutor Review" },
		{ href: "/dashboard/admin/bookings", label: "Bookings" },
		{ href: "/dashboard/admin/payouts", label: "Payouts" },
	],
};

export function DashboardMobileHeader({ role }: { role: Role }) {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const links = navItems[role] ?? navItems.student;

	// Close drawer when pathname changes
	useEffect(() => {
		if (pathname) {
			setIsOpen(false);
		}
	}, [pathname]);

	// Find active link label for display in mobile header
	const activeItem = links.find((link) => {
		if (link.href === "/dashboard") {
			return pathname === "/dashboard";
		}
		return pathname.startsWith(link.href);
	});
	const activeLabel = activeItem?.label ?? "Menu";

	return (
		<div className="md:hidden border-b border-border bg-white sticky top-16 z-30 w-full">
			<div className="flex h-12 items-center justify-between px-4 sm:px-6">
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Dashboard
					</span>
					<span className="text-xs text-muted-foreground">/</span>
					<span className="text-xs font-medium text-foreground">
						{activeLabel}
					</span>
				</div>

				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted cursor-pointer transition-all outline-none"
					aria-expanded={isOpen}
				>
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
					>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
					Sections
				</button>
			</div>

			{/* Slide-out Mobile Sidebar Drawer */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<button
						type="button"
						className="fixed inset-0 top-[112px] z-40 bg-black/20 backdrop-blur-xs animate-in fade-in duration-200 cursor-default border-none w-full h-full"
						onClick={() => setIsOpen(false)}
						aria-label="Close menu backdrop"
					/>

					{/* Drawer */}
					<div className="fixed inset-y-0 left-0 top-[112px] w-64 z-50 bg-white border-r border-border p-5 flex flex-col gap-4 shadow-xl animate-in slide-in-from-left duration-200">
						{/* Role badge */}
						<div>
							<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
								{role} Dashboard
							</span>
						</div>

						{/* Links list */}
						<nav className="flex flex-col gap-1 mt-2">
							{links.map((link) => {
								const isActive =
									link.href === "/dashboard"
										? pathname === "/dashboard"
										: pathname.startsWith(link.href);

								return (
									<Link
										key={link.href}
										href={link.href}
										className={cn(
											"rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
											isActive
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:bg-muted hover:text-foreground",
										)}
									>
										{link.label}
									</Link>
								);
							})}
						</nav>

						{/* Sign out */}
						<div className="mt-auto border-t border-border/60 pt-4">
							<button
								type="button"
								onClick={() => {
									setIsOpen(false);
									signOut({
										fetchOptions: {
											onSuccess: () => {
												window.location.href = "/";
											},
										},
									});
								}}
								className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
							>
								Sign Out
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
