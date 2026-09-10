const http = require("http");
const { Server } = require("socket.io");
const { io: ioClient } = require("socket.io-client");

const mockAuthService = { verifyToken: jest.fn() };
const mockChannelService = { requireMembership: jest.fn() };

jest.mock("../src/services/AuthService", () => ({
	AuthService: jest.fn(() => mockAuthService),
}));
jest.mock("../src/services/ChannelService", () => ({
	ChannelService: jest.fn(() => mockChannelService),
}));

const initSockets = require("../src/sockets");

describe("Socket.IO real-time layer (B4)", () => {
	let httpServer;
	let io;
	let port;

	beforeAll((done) => {
		httpServer = http.createServer();
		io = new Server(httpServer);
		initSockets(io);
		httpServer.listen(() => {
			port = httpServer.address().port;
			done();
		});
	});

	afterAll((done) => {
		io.close();
		httpServer.close(done);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	function connect(auth) {
		return ioClient(`http://localhost:${port}`, {
			auth,
			transports: ["websocket"],
			forceNew: true,
		});
	}

	it("rejects a connection with no token", (done) => {
		const client = connect({});
		client.on("connect_error", (err) => {
			expect(err.message).toBe("Authentication required");
			client.close();
			done();
		});
	});

	it("rejects a connection with an invalid token", (done) => {
		mockAuthService.verifyToken.mockImplementation(() => {
			throw new Error("jwt malformed");
		});

		const client = connect({ token: "bad-token" });
		client.on("connect_error", (err) => {
			expect(err.message).toBe("Invalid or expired token");
			client.close();
			done();
		});
	});

	it("accepts a connection with a valid token", (done) => {
		mockAuthService.verifyToken.mockReturnValue({
			userId: 1,
			email: "jane@example.com",
			name: "Jane Doe",
		});

		const client = connect({ token: "good-token" });
		client.on("connect", () => {
			expect(client.connected).toBe(true);
			client.close();
			done();
		});
	});

	describe("channel:join", () => {
		beforeEach(() => {
			mockAuthService.verifyToken.mockReturnValue({
				userId: 1,
				email: "jane@example.com",
				name: "Jane Doe",
			});
		});

		it("joins when the user is a channel member", (done) => {
			mockChannelService.requireMembership.mockResolvedValue({ userId: 1, channelId: 1 });

			const client = connect({ token: "good-token" });
			client.on("connect", () => {
				client.emit("channel:join", 1, (ack) => {
					expect(ack).toEqual({ ok: true });
					expect(mockChannelService.requireMembership).toHaveBeenCalledWith(1, 1);
					client.close();
					done();
				});
			});
		});

		it("refuses to join when the user is not a member", (done) => {
			mockChannelService.requireMembership.mockRejectedValue(
				new Error("You must join this channel before doing that"),
			);

			const client = connect({ token: "good-token" });
			client.on("connect", () => {
				client.emit("channel:join", 1, (ack) => {
					expect(ack.ok).toBe(false);
					expect(ack.error).toBe("You must join this channel before doing that");
					client.close();
					done();
				});
			});
		});
	});

	it("broadcasts message:new only to sockets in that channel's room", (done) => {
		mockAuthService.verifyToken.mockReturnValue({ userId: 1, email: "a@x.com", name: "A" });
		mockChannelService.requireMembership.mockResolvedValue({ userId: 1, channelId: 1 });

		const inRoom = connect({ token: "good-token" });
		const outOfRoom = connect({ token: "good-token" });
		let received = false;

		outOfRoom.on("message:new", () => {
			received = true;
		});

		inRoom.on("connect", () => {
			inRoom.emit("channel:join", 1, (ack) => {
				expect(ack.ok).toBe(true);

				inRoom.on("message:new", (payload) => {
					expect(payload.body).toBe("hey team");
					// Give the (deliberately never-joined) second socket a beat
					// to prove it did NOT receive the room-scoped broadcast.
					setTimeout(() => {
						expect(received).toBe(false);
						inRoom.close();
						outOfRoom.close();
						done();
					}, 50);
				});

				io.to("channel:1").emit("message:new", { body: "hey team" });
			});
		});
	});
});
