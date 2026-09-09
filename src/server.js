const http = require("http");
const { Server } = require("socket.io");

const env = require("./config/env");
const createApp = require("./app");
const prisma = require("./config/database");
const initSockets = require("./sockets");

async function main() {
	const app = createApp();
	const server = http.createServer(app);

	const io = new Server(server, { cors: { origin: "*" } });
	initSockets(io);
	// Controllers reach the io instance via req.app.get('io') to broadcast
	// a persisted message without importing the socket layer directly.
	app.set("io", io);

	await prisma.$queryRaw`SELECT 1`;
	console.log("✅ Database connected successfully");

	server.listen(env.port, () => {
		console.log(`Huddle API listening on port ${env.port}`);
	});

	const shutdown = (signal) => {
		console.log(`${signal} received — shutting down gracefully.`);
		server.close(() => {
			prisma.$disconnect().finally(() => process.exit(0));
		});
		setTimeout(() => process.exit(1), 10_000).unref();
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});
