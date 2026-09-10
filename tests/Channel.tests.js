const request = require("supertest");

const mockAuthService = {
	verifyToken: jest.fn(),
};
const mockChannelService = {
	joinChannel: jest.fn(),
	sendMessage: jest.fn(),
	listMessages: jest.fn(),
};

jest.mock("../src/services/AuthService", () => ({
	AuthService: jest.fn(() => mockAuthService),
}));
jest.mock("../src/services/ChannelService", () => ({
	ChannelService: jest.fn(() => mockChannelService),
}));
// app.js also wires workspace routes — mock that service too so this
// suite doesn't transitively touch the real Prisma client.
jest.mock("../src/services/WorkspaceService", () => ({
	WorkspaceService: jest.fn(() => ({})),
}));

const createApp = require("../src/app");
const AUTH_HEADER = { Authorization: "Bearer access-token" };

describe("Channel API", () => {
	let app;

	beforeEach(() => {
		app = createApp();
		jest.clearAllMocks();
		mockAuthService.verifyToken.mockReturnValue({
			userId: 1,
			email: "jane@example.com",
			name: "Jane Doe",
		});
	});

	it("rejects unauthenticated requests", async () => {
		const response = await request(app).post("/api/channels/1/join");
		expect(response.status).toBe(401);
	});

	describe("POST /api/channels/:channelId/join", () => {
		it("joins a channel", async () => {
			mockChannelService.joinChannel.mockResolvedValue({
				membership: { userId: 1, channelId: 1 },
				alreadyMember: false,
			});

			const response = await request(app).post("/api/channels/1/join").set(AUTH_HEADER);

			expect(response.status).toBe(201);
			expect(mockChannelService.joinChannel).toHaveBeenCalledWith(1, 1);
		});

		it("surfaces a 403 when not a workspace member", async () => {
			const AppError = require("../src/utils/AppError");
			mockChannelService.joinChannel.mockRejectedValue(
				new AppError("You must join this workspace before doing that", 403),
			);

			const response = await request(app).post("/api/channels/1/join").set(AUTH_HEADER);

			expect(response.status).toBe(403);
			expect(response.body.message).toBe("You must join this workspace before doing that");
		});
	});

	describe("POST /api/channels/:channelId/messages", () => {
		it("sends a message", async () => {
			mockChannelService.sendMessage.mockResolvedValue({
				id: 1,
				body: "hey team",
				channelId: 1,
				createdAt: new Date().toISOString(),
				user: { id: 1, name: "Jane Doe" },
			});

			const response = await request(app)
				.post("/api/channels/1/messages")
				.set(AUTH_HEADER)
				.send({ body: "hey team" });

			expect(response.status).toBe(201);
			expect(mockChannelService.sendMessage).toHaveBeenCalledWith(1, 1, "hey team");
		});

		it("rejects an empty message body", async () => {
			const response = await request(app)
				.post("/api/channels/1/messages")
				.set(AUTH_HEADER)
				.send({ body: "   " });

			expect(response.status).toBe(400);
			expect(mockChannelService.sendMessage).not.toHaveBeenCalled();
		});
	});

	describe("GET /api/channels/:channelId/messages", () => {
		it("lists channel messages", async () => {
			mockChannelService.listMessages.mockResolvedValue([]);

			const response = await request(app)
				.get("/api/channels/1/messages")
				.set(AUTH_HEADER);

			expect(response.status).toBe(200);
			expect(mockChannelService.listMessages).toHaveBeenCalledWith(1, 1, undefined);
		});
	});
});
