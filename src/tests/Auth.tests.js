const request = require("supertest");

const mockAuthService = {
	registerUser: jest.fn(),
	loginUser: jest.fn(),
	refreshToken: jest.fn(),
	getProfile: jest.fn(),
	updateUser: jest.fn(),
	changePassword: jest.fn(),
	verifyToken: jest.fn(),
};

jest.mock("../services/AuthService", () => ({
	AuthService: jest.fn(() => mockAuthService),
}));

const createApp = require("../app");

describe("Authentication API", () => {
	let app;

	beforeEach(() => {
		app = createApp();
		jest.clearAllMocks();
		mockAuthService.verifyToken.mockReturnValue({ userId: "user-1" });
	});

	describe("POST /api/auth/register", () => {
		it("registers a user from JSON", async () => {
			const result = {
				token: "access-token",
				refreshToken: "refresh-token",
				userId: "user-1",
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

		it("registers a user from text-only FormData", async () => {
			mockAuthService.registerUser.mockResolvedValue({ userId: "user-1" });

			const response = await request(app)
				.post("/api/auth/register")
				.field("name", "Jane Doe")
				.field("email", "jane@example.com")
				.field("password", "password123");

			expect(response.status).toBe(201);
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
	});

	describe("POST /api/auth/login", () => {
		it("logs in a user", async () => {
			const result = { token: "access-token", refreshToken: "refresh-token" };
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
	});

	describe("POST /api/auth/refresh-token", () => {
		it("refreshes an access token", async () => {
			const result = {
				token: "new-access-token",
				refreshToken: "new-refresh-token",
			};
			mockAuthService.refreshToken.mockResolvedValue(result);

			const response = await request(app)
				.post("/api/auth/refresh-token")
				.send({ refreshToken: "refresh-token" });

			expect(response.status).toBe(200);
			expect(response.body.data).toEqual(result);
			expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
				"refresh-token",
			);
		});

		it("requires a refresh token", async () => {
			const response = await request(app)
				.post("/api/auth/refresh-token")
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Refresh token is required");
		});
	});

	describe("protected profile endpoints", () => {
		it("rejects requests without a bearer token", async () => {
			const response = await request(app).get("/api/auth/profile");

			expect(response.status).toBe(401);
			expect(response.body.message).toBe(
				"Authorization header missing or malformed.",
			);
		});

		it("returns the authenticated user's profile", async () => {
			const profile = {
				id: "user-1",
				name: "Jane Doe",
				email: "jane@example.com",
			};
			mockAuthService.getProfile.mockResolvedValue(profile);

			const response = await request(app)
				.get("/api/auth/profile")
				.set("Authorization", "Bearer access-token");

			expect(response.status).toBe(200);
			expect(response.body.data).toEqual(profile);
			expect(mockAuthService.getProfile).toHaveBeenCalledWith("user-1");
		});

		it("updates the authenticated user's profile", async () => {
			mockAuthService.updateUser.mockResolvedValue({ userId: "user-1" });

			const response = await request(app)
				.put("/api/auth/update-profile")
				.set("Authorization", "Bearer access-token")
				.field("name", "Janet Doe")
				.field("email", "janet@example.com");

			expect(response.status).toBe(200);
			expect(mockAuthService.updateUser).toHaveBeenCalledWith(
				"user-1",
				"Janet Doe",
				"janet@example.com",
			);
		});

		it("changes the authenticated user's password", async () => {
			mockAuthService.changePassword.mockResolvedValue({ userId: "user-1" });

			const response = await request(app)
				.put("/api/auth/change-password")
				.set("Authorization", "Bearer access-token")
				.send({
					oldPassword: "oldpassword",
					newPassword: "newpassword",
					confirmNewPassword: "newpassword",
				});

			expect(response.status).toBe(200);
			expect(mockAuthService.changePassword).toHaveBeenCalledWith(
				"user-1",
				"oldpassword",
				"newpassword",
			);
		});

		it("rejects mismatched new passwords", async () => {
			const response = await request(app)
				.put("/api/auth/change-password")
				.set("Authorization", "Bearer access-token")
				.send({
					oldPassword: "oldpassword",
					newPassword: "newpassword",
					confirmNewPassword: "differentpassword",
				});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe(
				"New password and confirmed password do not match",
			);
			expect(mockAuthService.changePassword).not.toHaveBeenCalled();
		});
	});
});
