import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/forms/sign-in-form";
import { getSession } from "@/lib/auth-server";

export default async function SignInPage() {
	const session = await getSession();

	// If already authenticated, redirect to dashboard directly
	if (session) {
		redirect("/dashboard");
	}

	return (
		<Suspense fallback={<div className="text-center py-8">Loading...</div>}>
			<SignInForm />
		</Suspense>
	);
}
