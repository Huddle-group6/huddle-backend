const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/database");
const AppError = require("../utils/AppError");

// Generates an invite id shaped like "wdu-khdo-dum" (three 4/4/3-char
// segments) derived from a UUID, keeping the same fixed length every time.
function generateInviteId() {
	const hex = uuidv4().replace(/-/g, "").toUpperCase();
	return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 11)}`;
}

const DEFAULT_CHANNELS = ["general", "announcements"];

class WorkspaceService {
	// Creates the workspace, makes the creator a member, and auto-provisions
	// #general and #announcements with the creator already in both — a new
	// workspace should never open onto an empty channel list.
	async createWorkspace(name, creatorId) {
		const existingWorkspace = await prisma.workspace.findFirst({
			where: { name },
		});
		if (existingWorkspace) {
			throw new AppError("Workspace with this name already exists", 400);
		}

		const inviteId = generateInviteId();
		return prisma.$transaction(async (tx) => {
			const workspace = await tx.workspace.create({
				data: { inviteId, name, createdBy: creatorId },
			});

			await tx.workspaceMembership.create({
				data: { userId: creatorId, workspaceId: workspace.id },
			});

			for (const channelName of DEFAULT_CHANNELS) {
				const channel = await tx.channel.create({
					data: {
						name: channelName,
						workspaceId: workspace.id,
						createdBy: creatorId,
						isDefault: true,
					},
				});
				await tx.channelMembership.create({
					data: { userId: creatorId, channelId: channel.id },
				});
			}

			return workspace;
		});
	}

	async listWorkspaces(userId) {
		return prisma.workspace.findMany({
			where: { memberships: { some: { userId } } },
			orderBy: { createdAt: "asc" },
		});
	}

	async requireMembership(workspaceId, userId) {
		const membership = await prisma.workspaceMembership.findUnique({
			where: { userId_workspaceId: { userId, workspaceId } },
		});
		if (!membership) {
			throw new AppError("You must join this workspace before doing that", 403);
		}
		return membership;
	}

	// Join by id — no invite-code system yet, that's a later feature.
	// Joining auto-adds you to the default channels (#general,
	// #announcements), matching how a new member actually starts
	// participating — other channels still require an explicit join.
	async joinWorkspace(workspaceId, userId) {
		const workspace = await prisma.workspace.findUnique({
			where: { inviteId: workspaceId },
		});
		if (!workspace) {
			throw new AppError("Workspace not found", 404);
		}

		const existingMembership = await prisma.workspaceMembership.findUnique({
			where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
		});
		if (existingMembership) {
			return { membership: existingMembership, alreadyMember: true };
		}

		const membership = await prisma.$transaction(async (tx) => {
			const created = await tx.workspaceMembership.create({
				data: { userId, workspaceId: workspace.id },
			});

			const defaultChannels = await tx.channel.findMany({
				where: { workspaceId: workspace.id, isDefault: true },
			});
			for (const channel of defaultChannels) {
				await tx.channelMembership.upsert({
					where: { userId_channelId: { userId, channelId: channel.id } },
					create: { userId, channelId: channel.id },
					update: {},
				});
			}

			return created;
		});

		return { membership, alreadyMember: false };
	}
}

module.exports = { WorkspaceService };
