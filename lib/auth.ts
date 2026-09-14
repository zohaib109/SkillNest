import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import {
	readSelectedRoleCookie,
	resolveSelfServiceRole,
} from "@/lib/registration";
import { signUpCredentialsSchema } from "@/lib/validators/auth";

const globalForMongo = globalThis as unknown as {
	mongoClient: MongoClient | undefined;
};

export const client =
	globalForMongo.mongoClient ?? new MongoClient(env.MONGODB_URI);

if (process.env.NODE_ENV !== "production") {
	globalForMongo.mongoClient = client;
}

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: mongodbAdapter(client.db(), { client }),
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google"],
		},
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 10,
		maxPasswordLength: 100,
	},
	hooks: {
		before: createAuthMiddleware(async (context) => {
			if (context.path !== "/sign-up/email") return;

			const parsed = signUpCredentialsSchema.safeParse(context.body);
			if (!parsed.success) {
				throw new APIError("BAD_REQUEST", {
					message: parsed.error.issues[0]?.message ?? "Invalid signup details",
				});
			}

			return {
				context: {
					...context,
					body: {
						...context.body,
						...parsed.data,
					},
				},
			};
		}),
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // update every 24 hours
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "student",
				input: false,
			},
			status: {
				type: "string",
				required: true,
				defaultValue: "active",
				input: false,
			},
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail({ user, url });
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user, context) => {
					const selectedRoleCookie = readSelectedRoleCookie(
						context?.headers?.get("cookie"),
					);

					const role = resolveSelfServiceRole(user.role, selectedRoleCookie);

					return {
						data: {
							...user,
							role,
						},
					};
				},
				after: async (user) => {
					// If user signs up as a tutor, auto-create their TutorProfile shell
					if (user.role === "tutor") {
						try {
							const { TutorProfile } = await import("@/models/TutorProfile");
							const { generateUniqueSlug } = await import("@/lib/slug");
							const { connectDB } = await import("@/lib/db");

							await connectDB();
							const existingProfile = await TutorProfile.findOne({
								userId: user.id,
							});
							if (!existingProfile) {
								const slug = await generateUniqueSlug(
									user.name || "tutor",
									async (candidate) => {
										const count = await TutorProfile.countDocuments({
											slug: candidate,
										});
										return count > 0;
									},
								);

								await TutorProfile.create({
									userId: user.id,
									userName: user.name || "",
									userEmail: user.email,
									slug,
									status: "draft",
								});
							}
						} catch (e) {
							console.error(
								"Error creating TutorProfile in user after-create hook:",
								e,
							);
						}
					}
				},
			},
		},
	},
});
