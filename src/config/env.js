require("dotenv").config();

const required = ["JWT_SECRET", "DATABASE_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
	// A missing secret should crash on boot, not silently sign tokens with
	// a public fallback string.
	throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
}

module.exports = {
	port: Number(process.env.PORT) || 4000,
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "3d",
	isProduction: process.env.NODE_ENV === "production",
};
