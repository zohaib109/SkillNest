import mongoose from "mongoose";
import { env } from "@/lib/env";

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

// In development, use global to avoid hot-reload creating multiple connections
declare global {
	var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
	conn: null,
	promise: null,
};

if (process.env.NODE_ENV === "development") {
	globalThis.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(env.MONGODB_URI, {
				bufferCommands: false,
			})
			.catch((error: unknown) => {
				cached.promise = null;
				throw error;
			});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
