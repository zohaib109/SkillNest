import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/auth-server";

type Role = "student" | "tutor" | "admin";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	const role = (session.user.role ?? "student") as Role;

	return (
		<div className="flex flex-1">
			<DashboardSidebar role={role} />
			<main className="flex-1 overflow-y-auto bg-background p-6 sm:p-8 lg:p-10">
				{children}
			</main>
		</div>
	);
}
