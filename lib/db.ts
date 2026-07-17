import mongoose from "mongoose";

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
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error("MONGODB_URI environment variable is not defined");
	}

	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		cached.promise = mongoose.connect(uri, {
			bufferCommands: false,
		});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
