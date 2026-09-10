const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/AuthRoute");
const channelRoutes = require("./routes/ChannelRoute");

function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	app.get("/api/health", (_req, res) => {
		res.json({ status: "ok" });
	});

	app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

	app.use("/api/auth", authRoutes);
	app.use("/api/channels", channelRoutes);

	// eslint-disable-next-line no-unused-vars
	app.use((error, _req, res, _next) => {
		const statusCode = error.statusCode || 500;
		if (!error.isOperational) {
			// Unexpected error — log full detail server-side, never trust
			// it in the response.
			console.error(error);
		}
		res.status(statusCode).json({
			status: "error",
			message: error.isOperational ? error.message : "Internal server error",
		});
	});

	return app;
}

module.exports = createApp;
