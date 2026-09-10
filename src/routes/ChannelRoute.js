const express = require("express");
const ChannelController = require("../controllers/Channel/ChannelController");
const { authValidation } = require("../middlewares/AuthValidation");
const {
	validateCreateChannelInput,
	validateSendMessageInput,
} = require("../middlewares/ChannelValidation");

const router = express.Router();

// Every route below requires a signed-in user.
router.use(authValidation);

router.get("/", ChannelController.list);
router.post("/", validateCreateChannelInput, ChannelController.create);
router.post("/:channelId/join", ChannelController.join);

// Messaging lives under its channel — membership is enforced in the
// service layer (requireMembership), not here, so both REST and the
// Socket.IO join handler share the exact same check.
router.get("/:channelId/messages", ChannelController.listMessages);
router.post(
	"/:channelId/messages",
	validateSendMessageInput,
	ChannelController.sendMessage,
);

module.exports = router;
