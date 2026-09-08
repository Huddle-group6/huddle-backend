const { body, validationResult } = require("express-validator");
const { AuthService } = require("../../services/AuthService");

const authService = new AuthService();

const AuthController = {
	registerValidation: [
		body("name").notEmpty().withMessage("Name is required"),
		body("email").isEmail().withMessage("Valid email is required"),
		body("password")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters"),
	],

	loginValidation: [
		body("email").isEmail().withMessage("Valid email is required"),
		body("password")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters"),
	],

	changePasswordValidation: [
		body("oldPassword").notEmpty().withMessage("Old password is required"),
		body("newPassword")
			.isLength({ min: 8 })
			.withMessage("New password must be at least 8 characters"),
		body("confirmNewPassword")
			.isLength({ min: 8 })
			.withMessage("Confirm new password must be at least 8 characters"),
	],

	async register(req, res, next) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			const { name, email, password } = req.body;

			const result = await authService.registerUser(name, email, password);

			res.status(201).json({
				status: "success",
				message: "User registered successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	},

	async login(req, res, next) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			const { email, password } = req.body;

			const result = await authService.loginUser(email, password);

			res.status(200).json({
				status: "success",
				message: "Login successful",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	},

	async refreshToken(req, res, next) {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				throw new AppError("Refresh token is required", 400);
			}

			const result = await authService.refreshToken(refreshToken);

			res.status(200).json({
				status: "success",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	},

	async getProfile(req, res, next) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				throw new AppError("User not authenticated", 401);
			}

			const user = await authService.getProfile(userId);

			res.status(200).json({
				status: "success",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	},

	async updateProfile(req, res, next) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				throw new AppError("User not authenticated", 401);
			}

			const { name, email } = req.body;

			const user = await authService.updateUser(userId, name, email);

			res.status(200).json({
				status: "success",
				message: "Profile updated successfully",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	},

	async changePassword(req, res, next) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				throw new AppError("User not authenticated", 401);
			}

			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			if (req.body.newPassword.trim() !== req.body.confirmNewPassword.trim()) {
				throw new AppError(
					"New password and confirmed password do not match",
					400,
				);
			}

			const { oldPassword, newPassword } = req.body;

			const result = await authService.changePassword(
				userId,
				oldPassword,
				newPassword,
			);

			res.status(200).json({
				status: "success",
				message: "Password changed successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	},
};

module.exports = AuthController;
