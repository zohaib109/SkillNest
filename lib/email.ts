/**
 * Email Service Module
 *
 * DEVELOPMENT MODE:
 * No production email service (e.g., Resend, SendGrid, Postmark, or SMTP) is integrated yet.
 * In development, verification emails are formatted and logged to the server terminal.
 *
 * PRODUCTION SETUP REQUIREMENTS:
 * To activate real email delivery in production:
 * 1. Install your preferred mail provider SDK (e.g., `pnpm add resend`).
 * 2. Configure `RESEND_API_KEY` (or SMTP credentials) in `.env.local`.
 * 3. Replace the dev fallback block in `sendVerificationEmail()` with the provider API call.
 */

interface SendVerificationEmailOptions {
	user: {
		email: string;
		name?: string;
	};
	url: string;
}

export async function sendVerificationEmail({
	user,
	url,
}: SendVerificationEmailOptions): Promise<void> {
	// Future Production Email Provider Hook (e.g. Resend / SendGrid)
	if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) {
		// TODO: Replace with production mail provider call
		// await resend.emails.send({
		// 	from: "SkillNest <noreply@skillnest.com>",
		// 	to: user.email,
		// 	subject: "Verify your SkillNest email address",
		// 	html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
		// });
		return;
	}

	// Development Terminal Mailer
	console.log("\n=================== ✉️ DEV EMAIL SENT ✉️ ===================");
	console.log(` TO: ${user.email}`);
	console.log(` SUBJECT: Verify your SkillNest email address`);
	console.log(` VERIFICATION LINK:`);
	console.log(` ${url}`);
	console.log("===========================================================\n");
}
