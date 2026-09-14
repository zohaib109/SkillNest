import type { Role } from "@/lib/types";

export interface DashboardNavItem {
	href: string;
	label: string;
}

export const DASHBOARD_NAV_ITEMS: Record<Role, DashboardNavItem[]> = {
	student: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/dashboard/bookings", label: "My Bookings" },
	],
	tutor: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/dashboard/profile", label: "My Profile" },
		{ href: "/dashboard/availability", label: "Availability" },
	],
	admin: [
		{ href: "/dashboard", label: "Overview" },
		{ href: "/dashboard/admin/tutors", label: "Manage Tutors" },
		{ href: "/dashboard/admin/bookings", label: "Bookings" },
		{ href: "/dashboard/admin/payouts", label: "Payments & Payouts" },
	],
};
