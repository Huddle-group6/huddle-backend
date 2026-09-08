const express = require("express");
const multer = require("multer");
const AuthController = require("../controllers/Auth/AuthController");
const {
	validateRegisterInput,
	validateLoginInput,
	validateUpdateProfileInput,
	validateChangePasswordInput,
} = require("../middlewares/AuthValidation");

const router = express.Router();
const parseFormData = multer().none();

router.post(
	"/register",
	parseFormData,
	validateRegisterInput,
	AuthController.register,
);
router.post("/login", parseFormData, validateLoginInput, AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.get("/profile", AuthController.getProfile);
router.put(
	"/update-profile",
	parseFormData,
	validateUpdateProfileInput,
	AuthController.updateProfile,
);
router.put(
	"/change-password",
	parseFormData,
	validateChangePasswordInput,
	AuthController.changePassword,
);

module.exports = router;
