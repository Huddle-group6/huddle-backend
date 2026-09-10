const request = require("supertest");

const mockAuthService = {
	registerUser: jest.fn(),
	loginUser: jest.fn(),
	getProfile: jest.fn(),
	verifyToken: jest.fn(),
};

jest.mock("../src/services/AuthService", () => ({
	AuthService: jest.fn(() => mockAuthService),
}));
// app.js also wires up channel routes — mock that service too so this
// suite doesn't transitively touch the real Prisma client.
jest.mock("../src/services/ChannelService", () => ({
	ChannelService: jest.fn(() => ({})),
}));

const createApp = require("../src/app");

describe("Authentication API", () => {
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

	describe("POST /api/auth/register", () => {
		it("registers a user", async () => {
			const result = {
				token: "access-token",
				user: { id: 1, name: "Jane Doe", email: "jane@example.com" },
			};
			mockAuthService.registerUser.mockResolvedValue(result);

			const response = await request(app).post("/api/auth/register").send({
				name: "Jane Doe",
				email: "jane@example.com",
				password: "password123",
			});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				status: "success",
				message: "User registered successfully",
				data: result,
			});
			expect(mockAuthService.registerUser).toHaveBeenCalledWith(
				"Jane Doe",
				"jane@example.com",
				"password123",
			);
		});

		it.each([
			[{}, "Name is required"],
			[{ name: "Jane Doe" }, "Email is required"],
			[
				{ name: "Jane Doe", email: "invalid", password: "password123" },
				"Invalid email address",
			],
			[{ name: "Jane Doe", email: "jane@example.com" }, "Password is required"],
			[
				{ name: "Jane Doe", email: "jane@example.com", password: "short" },
				"Password must be at least 8 characters long",
			],
		])("rejects invalid input", async (body, message) => {
			const response = await request(app).post("/api/auth/register").send(body);

			expect(response.status).toBe(400);
			expect(response.body.message).toBe(message);
			expect(mockAuthService.registerUser).not.toHaveBeenCalled();
		});

		it("surfaces a 409 when the email is already registered", async () => {
			const AppError = require("../src/utils/AppError");
			mockAuthService.registerUser.mockRejectedValue(new AppError("User already exists", 409));

			const response = await request(app).post("/api/auth/register").send({
				name: "Jane Doe",
				email: "jane@example.com",
				password: "password123",
			});

			expect(response.status).toBe(409);
			expect(response.body.message).toBe("User already exists");
		});
	});

	describe("POST /api/auth/login", () => {
		it("logs in a user", async () => {
			const result = {
				token: "access-token",
				user: { id: 1, name: "Jane Doe", email: "jane@example.com" },
			};
			mockAuthService.loginUser.mockResolvedValue(result);

			const response = await request(app)
				.post("/api/auth/login")
				.send({ email: "jane@example.com", password: "password123" });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				status: "success",
				message: "Login successful",
				data: result,
			});
		});

		it("rejects missing credentials", async () => {
			const response = await request(app)
				.post("/api/auth/login")
				.send({ email: "jane@example.com" });

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Password is required");
		});

		it("surfaces a 401 with a generic message on bad credentials", async () => {
			const AppError = require("../src/utils/AppError");
			mockAuthService.loginUser.mockRejectedValue(
				new AppError("These credentials do not match our records.", 401),
			);

			const response = await request(app)
				.post("/api/auth/login")
				.send({ email: "jane@example.com", password: "wrongpassword" });

			expect(response.status).toBe(401);
			expect(response.body.message).toBe("These credentials do not match our records.");
		});
	});

	describe("GET /api/auth/profile", () => {
		it("rejects requests without a bearer token", async () => {
			const response = await request(app).get("/api/auth/profile");

			expect(response.status).toBe(401);
			expect(response.body.message).toBe("Authorization header missing or malformed.");
		});

		it("rejects an invalid or expired token", async () => {
			mockAuthService.verifyToken.mockImplementation(() => {
				throw new Error("jwt expired");
			});

			const response = await request(app)
				.get("/api/auth/profile")
				.set("Authorization", "Bearer bad-token");

			expect(response.status).toBe(401);
			expect(response.body.message).toBe("Invalid or expired token.");
		});

		it("returns the authenticated user's profile", async () => {
			const profile = { id: 1, name: "Jane Doe", email: "jane@example.com" };
			mockAuthService.getProfile.mockResolvedValue(profile);

			const response = await request(app)
				.get("/api/auth/profile")
				.set("Authorization", "Bearer access-token");

			expect(response.status).toBe(200);
			expect(response.body.data).toEqual(profile);
			expect(mockAuthService.getProfile).toHaveBeenCalledWith(1);
		});
	});
});
