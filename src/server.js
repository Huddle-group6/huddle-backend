require("dotenv").config();
const env = require("./config/env");
const createApp = require("./app");
const prisma = require("./config/database");

async function main() {
	const app = createApp();

	await prisma.$queryRaw`SELECT 1`;
	console.log("✅ Database connected successfully");

	app.listen(env.port, () => {
		console.log(`Huddle API listening on port ${env.port}`);
	});

	const shutdown = (signal) => {
		console.log(`${signal} received — shutting down gracefully.`);
		prisma.$disconnect().finally(() => process.exit(0));
		setTimeout(() => process.exit(1), 10_000).unref();
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});
