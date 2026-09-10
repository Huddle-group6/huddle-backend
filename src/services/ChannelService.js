const prisma = require("../config/database");
const AppError = require("../utils/AppError");

const MESSAGE_PAGE_SIZE = 50;

class ChannelService {
	// B1 — Create a Channel
	async createChannel(name, description, creatorId) {
		const existing = await prisma.channel.findUnique({ where: { name } });
		if (existing) {
			throw new AppError(`A channel named "${name}" already exists`, 409);
		}

		// The creator is automatically a member (PRD B1: "the channel exists
		// and I am automatically a member of it") — do both in one
		// transaction so a crash can't leave a channel with zero members.
		const channel = await prisma.$transaction(async (tx) => {
			const created = await tx.channel.create({
				data: { name, description, createdBy: creatorId },
			});
			await tx.channelMembership.create({
				data: { userId: creatorId, channelId: created.id },
			});
			return created;
		});

		return channel;
	}

	// Every channel is listable in this sprint — there's no workspace
	// boundary yet (that's Product Backlog), so "list channels" means
	// "every channel that exists".
	async listChannels() {
		return prisma.channel.findMany({
			orderBy: { createdAt: "asc" },
			include: { creator: { select: { id: true, name: true } } },
		});
	}

	// B2 — Join a Channel
	async joinChannel(channelId, userId) {
		const channel = await prisma.channel.findUnique({ where: { id: channelId } });
		if (!channel) {
			throw new AppError("Channel not found", 404);
		}

		const existingMembership = await prisma.channelMembership.findUnique({
			where: { userId_channelId: { userId, channelId } },
		});
		if (existingMembership) {
			return { membership: existingMembership, alreadyMember: true };
		}

		const membership = await prisma.channelMembership.create({
			data: { userId, channelId },
		});
		return { membership, alreadyMember: false };
	}

	async requireMembership(channelId, userId) {
		const membership = await prisma.channelMembership.findUnique({
			where: { userId_channelId: { userId, channelId } },
		});
		if (!membership) {
			throw new AppError("You must join this channel before doing that", 403);
		}
		return membership;
	}

	// B3 — Send a Message
	async sendMessage(channelId, userId, body) {
		await this.requireMembership(channelId, userId);

		const message = await prisma.message.create({
			data: { body, userId, channelId },
			include: { user: { select: { id: true, name: true } } },
		});
		return message;
	}

	// B4 — Receive a Message (history / initial load — live delivery is Socket.IO)
	async listMessages(channelId, userId, before) {
		await this.requireMembership(channelId, userId);

		const messages = await prisma.message.findMany({
			where: before ? { channelId, createdAt: { lt: before } } : { channelId },
			include: { user: { select: { id: true, name: true } } },
			orderBy: { createdAt: "desc" },
			take: MESSAGE_PAGE_SIZE,
		});
		return messages.reverse();
	}
}

module.exports = { ChannelService };
