const { AuthService } = require("../../services/AuthService");

const authService = new AuthService();

const AuthController = {
	async register(req, res, next) {
		try {
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

	async getProfile(req, res, next) {
		try {
			const user = await authService.getProfile(req.user.id);
			res.status(200).json({ status: "success", data: user });
		} catch (error) {
			next(error);
		}
	},

	// Not routed this sprint — profile editing is a backlog item.
	async updateProfile(req, res, next) {
		try {
			const { name, email } = req.body;
			const user = await authService.updateUser(req.user.id, name, email);
			res.status(200).json({
				status: "success",
				message: "Profile updated successfully",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	},

	// Not routed this sprint — password reset is a backlog item.
	async changePassword(req, res, next) {
		try {
			const { oldPassword, newPassword, confirmNewPassword } = req.body;
			if (newPassword !== confirmNewPassword) {
				return res
					.status(400)
					.json({ message: "New password and confirmed password do not match" });
			}
			const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
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
