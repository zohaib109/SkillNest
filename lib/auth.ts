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
});
