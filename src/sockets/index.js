const { AuthService } = require("../services/AuthService");
const { ChannelService } = require("../services/ChannelService");

const authService = new AuthService();
const channelService = new ChannelService();

/**
 * Wires Socket.IO onto the existing HTTP server.
 *
 * Client contract:
 *  - connect with `auth: { token: '<JWT>' }` (the same token from login)
 *  - emit 'channel:join', channelId, ack        → joins the room if a member
 *  - emit 'channel:leave', channelId
 *  - listen for 'message:new'                   → emitted by POST /channels/:id/messages
 *
 * Real-time delivery is additive, not authoritative: the message is
 * always persisted and confirmed over REST first (ChannelController.sendMessage).
 * A dropped socket never means a lost message, only a missed live update —
 * GET /channels/:id/messages is always the source of truth for history.
 */
function initSockets(io) {
	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token;
			if (!token) return next(new Error("Authentication required"));

			const decoded = authService.verifyToken(token);
			socket.user = { id: decoded.userId, email: decoded.email, name: decoded.name };
			next();
		} catch (err) {
			next(new Error("Invalid or expired token"));
		}
	});

	io.on("connection", (socket) => {
		socket.on("channel:join", async (channelId, ack) => {
			try {
				await channelService.requireMembership(Number(channelId), socket.user.id);
				socket.join(`channel:${channelId}`);
				ack?.({ ok: true });
			} catch (err) {
				ack?.({ ok: false, error: err.message || "Unable to join channel" });
			}
		});

		socket.on("channel:leave", (channelId) => {
			socket.leave(`channel:${channelId}`);
		});
	});
}

module.exports = initSockets;
