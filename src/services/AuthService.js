const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const bcrypt = require("bcrypt");
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
			"INSERT INTO users ( name, email, password) VALUES ($1, $2, $3) RETURNING id",
			[name, email, hashedPassword],
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

	async refreshToken(refreshToken) {
		const secret = process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";
		try {
			const payload = jwt.verify(refreshToken, secret);
			const newToken = this.generateToken(
				payload.userId,
				payload.email,
				payload.name,
			);
			const newRefreshToken = this.generateRefreshToken(payload.userId);
			return {
				token: newToken,
				refreshToken: newRefreshToken,
				userId: payload.userId,
			};
		} catch (err) {
			throw new Error("Invalid refresh token", 400);
		}
	}

	async getProfile(userId) {
		const user = await db.oneOrNone(
			"SELECT id, name, email, phone FROM users WHERE id = $1",
			[userId],
		);
		if (!user) {
			throw new Error("User not found", 404);
		}
		return user;
	}

	async updateUser(userId, name, email) {
		const updatedUser = await db.oneOrNone(
			"UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id",
			[name, email, userId],
		);
		if (!updatedUser) {
			throw new Error("User not found", 404);
		}
		return { userId: updatedUser.id };
	}

	async changePassword(userId, oldPassword, newPassword) {
		const user = await db.oneOrNone(
			"SELECT id, password FROM users WHERE id = $1",
			[userId],
		);
		if (!user) {
			throw new Error("User not found", 404);
		}

		const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
		if (!isOldPasswordValid) {
			throw new Error("Old password is incorrect", 400);
		}

		if (oldPassword === newPassword) {
			throw new Error(
				"New password must be different from the old password",
				400,
			);
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 10);
		const updatedUser = await db.oneOrNone(
			"UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
			[hashedNewPassword, userId],
		);
		if (!updatedUser) {
			throw new Error("User not found", 404);
		}
		return { userId: updatedUser.id };
	}
}

module.exports = { AuthService };
