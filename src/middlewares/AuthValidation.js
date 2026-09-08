const { AuthService } = require("./services/AuthService");
const authService = new AuthService();

const authValidation = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ message: "Authorization header missing or malformed." });
	}

	const token = authHeader.split(" ")[1];
	try {
		const decoded = authService.verifyToken(token);
		req.user = decoded; // Attach decoded user info to request object
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token." });
	}
};

const validateRegisterInput = (req, res, next) => {
	const { name, email, password } = req.body;
	if (!name) {
		return res.status(400).json({ message: "Name is required" });
	}
	if (!email) {
		return res.status(400).json({ message: "Email is required" });
	}
	if (!email.includes("@") || !email.includes(".")) {
		return res.status(400).json({ message: "Invalid email address" });
	}
	if (!password) {
		return res.status(400).json({ message: "Password is required" });
	}
	if (password.length < 8) {
		return res
			.status(400)
			.json({ message: "Password must be at least 8 characters long" });
	}

	next();
};

const validateLoginInput = (req, res, next) => {
	const { email, password } = req.body;
	if (!email) {
		return res.status(400).json({ message: "Email is required" });
	}
	if (!email.includes("@") || !email.includes(".")) {
		return res.status(400).json({ message: "Invalid email address" });
	}
	if (!password) {
		return res.status(400).json({ message: "Password is required" });
	}
	if (password.length < 8) {
		return res
			.status(400)
			.json({ message: "Password must be at least 8 characters long" });
	}

	next();
};

module.exports = {
	authValidation,
	validateRegisterInput,
	validateLoginInput,
};
