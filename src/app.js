const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/AuthRoute");

function createApp() {
	const app = express();

	app.use(cors());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.get("/api/health", (_req, res) => {
		res.json({ status: "ok" });
	});

	app.use("/api/auth", authRoutes);
	app.use((error, _req, res, _next) => {
		const statusCode = error.statusCode || 500;
		res
			.status(statusCode)
			.json({ message: error.message || "Internal server error" });
	});

	return app;
}

module.exports = createApp;
