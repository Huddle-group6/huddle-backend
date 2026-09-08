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

	return app;
}

module.exports = createApp;
