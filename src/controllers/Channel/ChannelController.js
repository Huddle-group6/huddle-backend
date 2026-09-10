const { ChannelService } = require("../../services/ChannelService");

const channelService = new ChannelService();

const ChannelController = {
	async join(req, res, next) {
		try {
			const channelId = Number(req.params.channelId);
			const result = await channelService.joinChannel(channelId, req.user.id);
			res.status(result.alreadyMember ? 200 : 201).json({ status: "success", data: result });
		} catch (error) {
			next(error);
		}
	},

	async sendMessage(req, res, next) {
		try {
			const channelId = Number(req.params.channelId);
			const message = await channelService.sendMessage(channelId, req.user.id, req.body.body);

			const payload = {
				id: message.id,
				body: message.body,
				channelId: message.channelId,
				createdAt: message.createdAt,
				author: message.user,
			};

			// REST confirms the write to the sender; Socket.IO fans it out
			// live to everyone else already in the channel room.
			const io = req.app.get("io");
			if (io) io.to(`channel:${channelId}`).emit("message:new", payload);

			res.status(201).json({ status: "success", data: payload });
		} catch (error) {
			next(error);
		}
	},

	async listMessages(req, res, next) {
		try {
			const channelId = Number(req.params.channelId);
			const before = req.query.before ? new Date(req.query.before) : undefined;
			const messages = await channelService.listMessages(channelId, req.user.id, before);
			res.status(200).json({ status: "success", data: messages });
		} catch (error) {
			next(error);
		}
	},
};

module.exports = ChannelController;
