const express = require("express");
const WorkspaceController = require("../controllers/Workspace/WorkspaceController");
const { authValidation } = require("../middlewares/AuthValidation");
const { validateCreateWorkspaceInput } = require("../middlewares/WorkspaceValidation");
const { validateCreateChannelInput } = require("../middlewares/ChannelValidation");

const router = express.Router();

router.use(authValidation);

router.post("/", validateCreateWorkspaceInput, WorkspaceController.create);
router.get("/", WorkspaceController.list);
router.post("/:workspaceId/join", WorkspaceController.join);

// Channel collection lives under its workspace — creating/listing
// channels requires workspace membership, enforced in ChannelService.
router.get("/:workspaceId/channels", WorkspaceController.listChannels);
router.post(
	"/:workspaceId/channels",
	validateCreateChannelInput,
	WorkspaceController.createChannel,
);

module.exports = router;
