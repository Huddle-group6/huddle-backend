const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
dotenv.config();

class AuthService {
	generateToken(userId, email, name) {
		const payload = { userId, email, name };
		const secret = process.env.JWT_SECRET || "default-secret";
		const options = {
			expiresIn: process.env.JWT_EXPIRES_IN || "1d",
		};
		return jwt.sign(payload, secret, options);
	}

	generateRefreshToken(userId) {
		const payload = { userId };
		const secret = process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";
		const options = {
			expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "1d",
		};
		return jwt.sign(payload, secret, options);
	}

	verifyToken(token) {
		const secret = process.env.JWT_SECRET || "default-secret";
		try {
			return jwt.verify(token, secret);
		} catch (err) {
			return null;
		}
	}

	async registerUser(name, email, password) {
		const existingUser = await db.oneOrNone(
			"SELECT id FROM users WHERE email = $1",
			[email],
		);
		if (existingUser) {
			throw new Error("User already exists", 400);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await db.one(
			"INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
			[uuidv4(), name, email, hashedPassword],
		);

		const token = this.generateToken(newUser.id, email, name);
		const refreshToken = this.generateRefreshToken(newUser.id);
		return { token, refreshToken, userId: newUser.id };
	}

	async loginUser(email, password) {
		const user = await db.oneOrNone(
			"SELECT id, name, email, password FROM users WHERE email = $1",
			[email],
		);
		if (!user) {
			throw new Error("These credentials do not match our records.", 400);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new Error("These credentials do not match our records.", 400);
		}

		const token = this.generateToken(user.id, user.email, user.name);
		const refreshToken = this.generateRefreshToken(user.id);
		return { token, refreshToken, userId: user.id };
	}

	async updateUser(userId, name, email, password) {
		const hashedPassword = await bcrypt.hash(password, 10);
		const updatedUser = await db.oneOrNone(
			"UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id",
			[name, email, hashedPassword, userId],
		);
		if (!updatedUser) {
			throw new Error("User not found", 404);
		}
		return { userId: updatedUser.id };
	}
}

module.exports = { AuthService };
