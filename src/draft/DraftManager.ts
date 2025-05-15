import type { redis } from "../redis.js";
import { randomUUID } from "node:crypto";

export class DraftManager {
	constructor(private redisBridge: RedisBridge) {}
	public async initDraft({ channelId, guildId, players }: InitDraftArgs) {
		const exists = await this.redisBridge.getDraft(guildId, channelId);
		if (exists && exists.phase === "picking")
			return "draft-already-in-progress";

		if (players.length < 10) return "not-enough-players";
		// validate players

		// Randomly select captains
		const shuffled = [...players].sort(() => Math.random() - 0.5);
		const captains: [Player, Player] = [shuffled[0], shuffled[1]];
		const remaining = shuffled.slice(2);

		const turnOrder = [
			captains[0].id,
			captains[1].id,
			captains[1].id,
			captains[0].id,
			captains[0].id,
			captains[1].id,
		];

		const draft: Draft = {
			guildId,
			channelId,
			draftId: randomUUID(),
			players,
			captains,
			availablePlayers: remaining,
			teams: {
				[captains[0].id]: [],
				[captains[1].id]: [],
			},
			turnOrder,
			currentTurnIndex: 0,
			phase: "picking",
		};

		return this.redisBridge.saveDraft(draft);
	}

	public async pickPlayer({
		captainId,
		channelId,
		guildId,
		playerId,
	}: PickPlayerArgs) {
		const draft = await this.redisBridge.getDraft(guildId, channelId);
		if (!draft) return "draft-not-found";
		if (draft.phase !== "picking") return "draft-not-in-progress";

		const expectedCaptain = draft.turnOrder[draft.currentTurnIndex];

		if (captainId !== expectedCaptain) "invalid-captain-turn";

		const player = draft.availablePlayers.find((p) => p.id === playerId);
		if (!player) return "player-not-available";

		draft.teams[captainId].push(player);
		draft.availablePlayers = draft.availablePlayers.filter(
			(p) => p.id !== playerId,
		);
		draft.currentTurnIndex++;

		if (draft.currentTurnIndex >= draft.turnOrder.length) {
			draft.phase = "complete";
		}

		await this.redisBridge.saveDraft(draft);
		return draft;
	}
}

export class RedisBridge {
	constructor(private redisInstance: typeof redis) {}
	public async cancelDraft(guildId: string, channelId: string) {
		await this.redisInstance.del(getDraftKey(guildId, channelId));
	}

	public async getDraft(guildId: string, channelId: string) {
		const raw = await this.redisInstance.get(getDraftKey(guildId, channelId));
		return raw ? (JSON.parse(raw) as Draft) : null;
	}

	public async saveDraft(draft: Draft) {
		await this.redisInstance.set(
			getDraftKey(draft.guildId, draft.channelId),
			JSON.stringify(draft),
			"EX",
			3600,
		);

		return draft;
	}
}

type Player = {
	id: string;
	username: string;
	mainRole: string;
	offRole: string;
};

type Draft = {
	guildId: string;
	channelId: string;
	draftId: string;
	players: Player[];
	captains: [Player, Player];
	teams: Record<string, Player[]>;
	availablePlayers: Player[];
	turnOrder: string[]; // array of captainIds
	currentTurnIndex: number;
	phase: "picking" | "complete" | "cancelled";
};

const getDraftKey = (guildId: string, channelId: string) =>
	`draft:${guildId}:${channelId}`;

type InitDraftArgs = {
	guildId: string;
	channelId: string;
	players: Player[];
};

type PickPlayerArgs = {
	guildId: string;
	channelId: string;
	captainId: string;
	playerId: string;
};
