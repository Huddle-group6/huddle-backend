import pgPromise from "pg-promise";
import { logger } from "../utils/logger";

const pgp = pgPromise({
	error(err, e) {
		if (e.cn) {
			logger.error("Database connection error:", err);
		}
		if (e.query) {
			logger.error("Query error:", err);
		}
	},
});

const connectionString =
	process.env.DATABASE_URL || "postgresql://localhost:5432/eventful";

export const db = pgp(connectionString);

// Test connection
db.connect()
	.then((obj) => {
		obj.done();
		logger.info("Database connection established");
	})
	.catch((error) => {
		logger.error("Database connection failed:", error);
	});

export { pgp };
