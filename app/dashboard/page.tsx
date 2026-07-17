import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-server";

export default async function DashboardPage() {
	const session = await getSession();
	const user = session?.user;
	const role = user?.role ?? "student";

	return (
		<div className="flex flex-col gap-8">
			{/* Welcome header */}
			<div>
				<h1 className="text-3xl tracking-tight text-foreground">
					Welcome back{user?.name ? `, ${user.name}` : ""}
				</h1>
				<p className="mt-1 text-muted-foreground">
					Here&apos;s what&apos;s happening with your account.
				</p>
			</div>

			{/* Role-specific dashboard cards */}
			{role === "student" && (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<DashboardCard
						title="Find a Tutor"
						description="Browse our curated directory of expert tutors across all subjects."
						action={
							<Link
								href="/tutors"
								className={buttonVariants({
									variant: "default",
									size: "sm",
								})}
							>
								Browse Tutors
							</Link>
						}
					/>
					<DashboardCard
						title="My Bookings"
						description="View your upcoming and past lessons."
						action={
							<Link
								href="/dashboard/bookings"
								className={buttonVariants({
									variant: "outline",
									size: "sm",
								})}
							>
								View Bookings
							</Link>
						}
					/>
					<DashboardCard
						title="Profile"
						description="Update your account details and preferences."
						action={
							<Link
								href="/complete-profile"
								className={buttonVariants({
									variant: "outline",
									size: "sm",
								})}
							>
								Edit Profile
							</Link>
						}
					/>
				</div>
			)}

			{role === "tutor" && (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<DashboardCard
						title="Tutor Profile"
						description="Complete and manage your public tutor profile."
						action={
							<Link
								href="/dashboard/profile"
								className={buttonVariants({
									variant: "default",
									size: "sm",
								})}
							>
								Manage Profile
							</Link>
						}
					/>
					<DashboardCard
						title="Availability"
						description="Set your available teaching hours and time slots."
						action={
							<Link
								href="/dashboard/availability"
								className={buttonVariants({
									variant: "outline",
									size: "sm",
								})}
							>
								Set Availability
							</Link>
						}
					/>
				</div>
			)}

			{role === "admin" && (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<DashboardCard
						title="Manage Tutors"
						description="Review and approve tutor applications."
						action={
							<Link
								href="/dashboard/admin/tutors"
								className={buttonVariants({
									variant: "default",
									size: "sm",
								})}
							>
								Review Tutors
							</Link>
						}
					/>
					<DashboardCard
						title="Bookings"
						description="Oversee all platform bookings and resolve issues."
						action={
							<Link
								href="/dashboard/admin/bookings"
								className={buttonVariants({
									variant: "outline",
									size: "sm",
								})}
							>
								View Bookings
							</Link>
						}
					/>
					<DashboardCard
						title="Payouts"
						description="Process manual tutor payouts."
						action={
							<Link
								href="/dashboard/admin/payouts"
								className={buttonVariants({
									variant: "outline",
									size: "sm",
								})}
							>
								Manage Payouts
							</Link>
						}
					/>
				</div>
			)}
		</div>
	);
}

function DashboardCard({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
			<div className="flex flex-col gap-1">
				<h3 className="text-lg text-foreground">{title}</h3>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<div>{action}</div>
		</div>
	);
}
