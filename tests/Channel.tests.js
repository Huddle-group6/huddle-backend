const request = require("supertest");

const mockAuthService = {
	verifyToken: jest.fn(),
};
const mockChannelService = {
	createChannel: jest.fn(),
	listChannels: jest.fn(),
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
		const response = await request(app).get("/api/channels");
		expect(response.status).toBe(401);
	});

	describe("POST /api/channels", () => {
		it("creates a channel", async () => {
			const channel = { id: 1, name: "general", createdBy: 1 };
			mockChannelService.createChannel.mockResolvedValue(channel);

			const response = await request(app)
				.post("/api/channels")
				.set(AUTH_HEADER)
				.send({ name: "general" });

			expect(response.status).toBe(201);
			expect(response.body.data).toEqual(channel);
			expect(mockChannelService.createChannel).toHaveBeenCalledWith("general", undefined, 1);
		});

		it("rejects an invalid channel name", async () => {
			const response = await request(app)
				.post("/api/channels")
				.set(AUTH_HEADER)
				.send({ name: "Not Valid!" });

			expect(response.status).toBe(400);
			expect(mockChannelService.createChannel).not.toHaveBeenCalled();
		});
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
