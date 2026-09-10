const { WorkspaceService } = require("../../services/WorkspaceService");
const { ChannelService } = require("../../services/ChannelService");

const workspaceService = new WorkspaceService();
const channelService = new ChannelService();

const WorkspaceController = {
	async create(req, res, next) {
		try {
			const { name } = req.body;
			const workspace = await workspaceService.createWorkspace(name, req.user.id);
			res.status(201).json({ status: "success", data: workspace });
		} catch (error) {
			next(error);
		}
	},

	async list(req, res, next) {
		try {
			const workspaces = await workspaceService.listWorkspaces(req.user.id);
			res.status(200).json({ status: "success", data: workspaces });
		} catch (error) {
			next(error);
		}
	},

	async join(req, res, next) {
		try {
			const workspaceId = Number(req.params.workspaceId);
			const result = await workspaceService.joinWorkspace(workspaceId, req.user.id);
			res.status(result.alreadyMember ? 200 : 201).json({ status: "success", data: result });
		} catch (error) {
			next(error);
		}
	},

	async listChannels(req, res, next) {
		try {
			const workspaceId = Number(req.params.workspaceId);
			const channels = await channelService.listChannels(workspaceId, req.user.id);
			res.status(200).json({ status: "success", data: channels });
		} catch (error) {
			next(error);
		}
	},

	async createChannel(req, res, next) {
		try {
			const workspaceId = Number(req.params.workspaceId);
			const { name, description } = req.body;
			const channel = await channelService.createChannel(
				workspaceId,
				name,
				description,
				req.user.id,
			);
			res.status(201).json({ status: "success", data: channel });
		} catch (error) {
			next(error);
		}
	},
};

module.exports = WorkspaceController;
