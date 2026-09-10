const express = require("express");
const ChannelController = require("../controllers/Channel/ChannelController");
const { authValidation } = require("../middlewares/AuthValidation");
const { validateSendMessageInput } = require("../middlewares/ChannelValidation");

const router = express.Router();

// Every route below requires a signed-in user.
router.use(authValidation);

// Listing/creating channels now lives under /workspaces/:workspaceId/channels
// — a channel only ever exists inside a workspace. These routes act on a
// specific, already-known channel by its own id.
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
