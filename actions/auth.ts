"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function signUpWithEmail(formData: {
	name: string;
	email: string;
	password: string;
	role: "student" | "tutor";
}) {
	const headersList = await headers();

	const result = await auth.api.signUpEmail({
		body: {
			name: formData.name,
			email: formData.email,
			password: formData.password,
			role: formData.role,
		},
		headers: headersList,
	});

	return result;
}
