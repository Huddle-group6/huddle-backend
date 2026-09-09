const express = require("express");
const AuthController = require("../controllers/Auth/AuthController");
const {
	validateRegisterInput,
	validateLoginInput,
	// validateUpdateProfileInput,
	// validateChangePasswordInput,
	authValidation,
} = require("../middlewares/AuthValidation");

const router = express.Router();

router.post("/register", validateRegisterInput, AuthController.register);
router.post("/login", validateLoginInput, AuthController.login);
router.get("/profile", authValidation, AuthController.getProfile);

// Deferred to Product Backlog per the PRD (profile editing / password
// reset are out of Sprint 1 scope). Controller + service logic
// is implemented and Prisma-ported.
// I commented the codes so as not to trow them away. Just uncomment
// when the story is picked up, no rework needed.
//
// router.put(
// 	"/update-profile",
// 	validateUpdateProfileInput,
// 	authValidation,
// 	AuthController.updateProfile,
// );
// router.put(
// 	"/change-password",
// 	validateChangePasswordInput,
// 	authValidation,
// 	AuthController.changePassword,
// );

module.exports = router;
