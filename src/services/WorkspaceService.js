const prisma = require("../config/database");
const AppError = require("../utils/AppError");

const DEFAULT_CHANNELS = ["general", "announcements"];

class WorkspaceService {
	// Creates the workspace, makes the creator a member, and auto-provisions
	// #general and #announcements with the creator already in both — a new
	// workspace should never open onto an empty channel list.
	async createWorkspace(name, creatorId) {
		return prisma.$transaction(async (tx) => {
			const workspace = await tx.workspace.create({
				data: { name, createdBy: creatorId },
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
		const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
		if (!workspace) {
			throw new AppError("Workspace not found", 404);
		}

		const existingMembership = await prisma.workspaceMembership.findUnique({
			where: { userId_workspaceId: { userId, workspaceId } },
		});
		if (existingMembership) {
			return { membership: existingMembership, alreadyMember: true };
		}

		const membership = await prisma.$transaction(async (tx) => {
			const created = await tx.workspaceMembership.create({
				data: { userId, workspaceId },
			});

			const defaultChannels = await tx.channel.findMany({
				where: { workspaceId, isDefault: true },
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
