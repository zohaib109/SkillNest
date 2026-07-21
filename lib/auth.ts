import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
	mongoClient: MongoClient | undefined;
};

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/skillnest";
export const client = globalForMongo.mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
	globalForMongo.mongoClient = client;
}

import { headers } from "next/headers";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	database: mongodbAdapter(client.db()),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
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
				input: true, // allow client to set during sign-up
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
			console.log(`Verify email for ${user.email} with link: ${url}`);
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// Prefer role passed directly in request body (e.g. email signUp)
					let role = user.role;

					if (!role) {
						role = "student";
						try {
							const headersList = await headers();
							const cookieHeader = headersList.get("cookie") || "";
							const match = cookieHeader.match(/selected_role=(student|tutor)/);
							if (match) {
								role = match[1];
							}
						} catch (e) {
							console.error("Error reading headers in user create hook:", e);
						}
					}

					return {
						data: {
							...user,
							role: role,
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

								const headersList = await headers();
								const cookieHeader = headersList.get("cookie") || "";

								let headline = "Professional Tutor";
								let hourlyRate = 20;
								let subjects: string[] = [];

								const headlineMatch = cookieHeader.match(
									/tutor_headline=([^;]+)/,
								);
								if (headlineMatch) {
									headline = decodeURIComponent(headlineMatch[1]);
								}
								const rateMatch = cookieHeader.match(/tutor_rate=(\d+)/);
								if (rateMatch) {
									hourlyRate = Number(rateMatch[1]);
								}
								const subjectsMatch = cookieHeader.match(
									/tutor_subjects=([^;]+)/,
								);
								if (subjectsMatch) {
									subjects = decodeURIComponent(subjectsMatch[1])
										.split(",")
										.filter(Boolean);
								}

								await TutorProfile.create({
									userId: user.id,
									userName: user.name || "",
									userEmail: user.email,
									slug,
									headline,
									hourlyRate,
									subjects,
									bio: "I am a professional tutor on SkillNest. I will update my bio later.",
									languages: ["English"],
									currency: "USD",
									country: "Pakistan",
									timezone: "Asia/Karachi",
									lessonDurations: [60],
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
