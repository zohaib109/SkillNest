import { redirect } from "next/navigation";
import { DashboardMobileHeader } from "@/components/dashboard/mobile-header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { EmailVerificationPrompt } from "@/components/dashboard/verification-prompt";
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

	// Enforce Email Verification for MVP
	if (!session.user.emailVerified) {
		return <EmailVerificationPrompt email={session.user.email} />;
	}

	const role = (session.user.role ?? "student") as Role;

	return (
		<div className="flex flex-col md:flex-row flex-1 min-h-0">
			{/* Mobile-only dashboard section header */}
			<DashboardMobileHeader role={role} />

			{/* Sidebar for desktop */}
			<DashboardSidebar role={role} />

			{/* Main Content Area */}
			<main className="flex-1 overflow-y-auto bg-background p-6 sm:p-8 lg:p-10">
				{children}
			</main>
		</div>
	);
}
