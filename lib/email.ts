/**
 * Email Service Module
 *
 * DEVELOPMENT MODE:
 * No production email service (e.g., Resend, SendGrid, Postmark, or SMTP) is integrated yet.
 * In development, verification emails are formatted and logged to the server terminal.
 *
 * PRODUCTION SETUP REQUIREMENTS:
 * To activate real email delivery in production:
 * 1. Select a transactional mail provider and verify the sending domain.
 * 2. Install its SDK and configure credentials in `.env.local`.
 * 3. Replace the production guard in `sendVerificationEmail()` with the provider call.
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
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"Production email delivery is not configured. Configure a transactional email provider before deployment.",
		);
	}

	// Development Terminal Mailer
	console.log("\n=================== ✉️ DEV EMAIL SENT ✉️ ===================");
	console.log(` TO: ${user.email}`);
	console.log(` SUBJECT: Verify your SkillNest email address`);
	console.log(` VERIFICATION LINK:`);
	console.log(` ${url}`);
	console.log("===========================================================\n");
}
