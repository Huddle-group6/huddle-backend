const pgPromise = require("pg-promise");

const pgp = pgPromise({
	error(err, e) {
		if (e.cn) {
			console.error("Database connection error:", err);
		}
		if (e.query) {
			console.error("Query error:", err);
		}
	},
});

const connectionString =
	process.env.DATABASE_URL || "postgresql://localhost:5432/huddle";

const db = pgp(connectionString);

// Test connection
db.connect()
	.then((obj) => {
		obj.done();
		console.log("Database connection established");
	})
	.catch((error) => {
		console.error("Database connection failed:", error);
	});

module.exports = { db, pgp };
