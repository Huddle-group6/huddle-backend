require("dotenv").config();
const createApp = require("./app");

const { db } = require("./config/database");

const PORT = process.env.PORT || 4000;
const app = createApp();

const startServer = async () => {
	try {
		// Test database connection
		await db.one("SELECT NOW()");
		console.log("✅ Database connected successfully");

		// Start server
		app.listen(PORT, () => {
			console.log(`Huddle API listening on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
	// app.listen(PORT, () => {
	//   console.log(`Huddle API listening on port ${PORT}`);
	// });
};

startServer();
