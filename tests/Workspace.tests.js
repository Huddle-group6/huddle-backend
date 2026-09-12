const request = require("supertest");

const mockAuthService = { verifyToken: jest.fn() };
const mockWorkspaceService = {
	createWorkspace: jest.fn(),
	listWorkspaces: jest.fn(),
	joinWorkspace: jest.fn(),
};
const mockChannelService = {
	listChannels: jest.fn(),
	createChannel: jest.fn(),
};

jest.mock("../src/services/AuthService", () => ({
	AuthService: jest.fn(() => mockAuthService),
}));
jest.mock("../src/services/WorkspaceService", () => ({
	WorkspaceService: jest.fn(() => mockWorkspaceService),
}));
jest.mock("../src/services/ChannelService", () => ({
	ChannelService: jest.fn(() => mockChannelService),
}));

const createApp = require("../src/app");
const AUTH_HEADER = { Authorization: "Bearer access-token" };

describe("Workspace API", () => {
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
		const response = await request(app).get("/api/workspaces");
		expect(response.status).toBe(401);
	});

	describe("POST /api/workspaces", () => {
		it("creates a workspace", async () => {
			const workspace = {
				id: 1,
				inviteID: "some-invite-id",
				name: "Acme Corp",
				createdBy: 1,
			};
			mockWorkspaceService.createWorkspace.mockResolvedValue(workspace);

			const response = await request(app)
				.post("/api/workspaces")
				.set(AUTH_HEADER)
				.send({ name: "Acme Corp" });

			expect(response.status).toBe(201);
			expect(response.body.data).toEqual(workspace);
			expect(mockWorkspaceService.createWorkspace).toHaveBeenCalledWith(
				"Acme Corp",
				1,
			);
		});

		it("rejects a missing name", async () => {
			const response = await request(app)
				.post("/api/workspaces")
				.set(AUTH_HEADER)
				.send({});

			expect(response.status).toBe(400);
			expect(mockWorkspaceService.createWorkspace).not.toHaveBeenCalled();
		});
	});

	describe("GET /api/workspaces", () => {
		it("lists the caller's workspaces only", async () => {
			mockWorkspaceService.listWorkspaces.mockResolvedValue([
				{ id: 1, name: "Acme Corp" },
			]);

			const response = await request(app)
				.get("/api/workspaces")
				.set(AUTH_HEADER);

			expect(response.status).toBe(200);
			expect(mockWorkspaceService.listWorkspaces).toHaveBeenCalledWith(1);
		});
	});

	describe("POST /api/workspaces/:workspaceId/join", () => {
		it("joins a workspace by id", async () => {
			mockWorkspaceService.joinWorkspace.mockResolvedValue({
				membership: { userId: 1, inviteID: "some-invite-id" },
				alreadyMember: false,
			});

			const response = await request(app)
				.post("/api/workspaces/some-invite-id/join")
				.set(AUTH_HEADER);

			expect(response.status).toBe(201);
			expect(mockWorkspaceService.joinWorkspace).toHaveBeenCalledWith(
				1,
				"some-invite-id",
			);
		});

		it("returns 404 for a workspace that doesn't exist", async () => {
			const AppError = require("../src/utils/AppError");
			mockWorkspaceService.joinWorkspace.mockRejectedValue(
				new AppError("Workspace not found", 404),
			);

			const response = await request(app)
				.post("/api/workspaces/999/join")
				.set(AUTH_HEADER);

			expect(response.status).toBe(404);
		});
	});

	describe("GET /api/workspaces/:workspaceId/channels", () => {
		it("lists channels in a workspace", async () => {
			mockChannelService.listChannels.mockResolvedValue([
				{ id: 1, name: "general", isDefault: true },
			]);

			const response = await request(app)
				.get("/api/workspaces/1/channels")
				.set(AUTH_HEADER);

			expect(response.status).toBe(200);
			expect(mockChannelService.listChannels).toHaveBeenCalledWith(1, 1);
		});

		it("surfaces a 403 when not a workspace member", async () => {
			const AppError = require("../src/utils/AppError");
			mockChannelService.listChannels.mockRejectedValue(
				new AppError("You must join this workspace before doing that", 403),
			);

			const response = await request(app)
				.get("/api/workspaces/1/channels")
				.set(AUTH_HEADER);

			expect(response.status).toBe(403);
		});
	});

	describe("POST /api/workspaces/:workspaceId/channels", () => {
		it("creates a channel inside the workspace", async () => {
			const channel = { id: 5, workspaceId: 1, name: "random" };
			mockChannelService.createChannel.mockResolvedValue(channel);

			const response = await request(app)
				.post("/api/workspaces/1/channels")
				.set(AUTH_HEADER)
				.send({ name: "random" });

			expect(response.status).toBe(201);
			expect(mockChannelService.createChannel).toHaveBeenCalledWith(
				1,
				"random",
				undefined,
				1,
			);
		});

		it("rejects an invalid channel name", async () => {
			const response = await request(app)
				.post("/api/workspaces/1/channels")
				.set(AUTH_HEADER)
				.send({ name: "Not Valid!" });

			expect(response.status).toBe(400);
			expect(mockChannelService.createChannel).not.toHaveBeenCalled();
		});
	});
});
