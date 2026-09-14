"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { DASHBOARD_NAV_ITEMS } from "@/lib/dashboard-navigation";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ role }: { role: Role }) {
	const pathname = usePathname();
	const links = DASHBOARD_NAV_ITEMS[role];

	return (
		<aside className="hidden w-64 shrink-0 border-r border-border bg-white md:block">
			<div className="flex h-full flex-col p-6">
				{/* Role badge */}
				<div className="mb-6">
					<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
						{role}
					</span>
				</div>

				{/* Nav links */}
				<nav className="flex flex-col gap-1">
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
									"rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
				<div className="mt-auto pt-6">
					<button
						type="button"
						onClick={() => signOut()}
						className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
					>
						Sign Out
					</button>
				</div>
			</div>
		</aside>
	);
}
