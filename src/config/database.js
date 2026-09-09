const { PrismaClient } = require("@prisma/client");

// A single shared client — creating a new PrismaClient per request/module
// exhausts Supabase's pooled connection limit fast.
const prisma = new PrismaClient({
	log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

module.exports = prisma;
