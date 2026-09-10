require("dotenv").config();

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../../generated/prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// A single shared client
// creating a new PrismaClient per request/module exhausts Supabase's pooled connection limit fast.
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

module.exports = prisma;
