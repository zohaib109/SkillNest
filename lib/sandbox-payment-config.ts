interface SandboxConfig {
	enabled: string | undefined;
	nodeEnv: string | undefined;
	mongoUri: string;
	authUrl: string;
}

export function allowsSandboxPayments({
	enabled,
	nodeEnv,
	mongoUri,
	authUrl,
}: SandboxConfig) {
	if (enabled !== "true" || (nodeEnv !== "development" && nodeEnv !== "test"))
		return false;
	try {
		const database = new URL(mongoUri);
		const origin = new URL(authUrl);
		return (
			database.protocol === "mongodb:" &&
			database.hostname === "127.0.0.1" &&
			/^\/skillnest_sandbox_[a-z\d_]+$/.test(database.pathname) &&
			database.searchParams.getAll("directConnection").join() === "true" &&
			["127.0.0.1", "localhost"].includes(origin.hostname)
		);
	} catch {
		return false;
	}
}
