import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

let _client: MongoClient | null = null;

function getClient() {
	if (!_client) {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			throw new Error("MONGODB_URI environment variable is not defined");
		}
		_client = new MongoClient(uri);
	}
	return _client;
}

export const auth = betterAuth({
	database: mongodbAdapter(
		new Proxy({} as ReturnType<typeof MongoClient.prototype.db>, {
			get(_target, prop, receiver) {
				return Reflect.get(getClient().db(), prop, receiver);
			},
		}),
	),
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
