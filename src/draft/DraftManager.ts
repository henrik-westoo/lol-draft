import { PLAYER_COUNT } from "../constants.js";
import type { redis } from "../redis.js";
import { randomUUID } from "node:crypto";
import type { Player, Draft } from "../types.js";

export class DraftManager {
	constructor(
		private redisBridge: RedisBridge,
		private connect: {
			guildId: string;
			channelId: string;
		},
	) {}

	private draftKey = `draft:${this.connect.guildId}:${this.connect.channelId}`;

	public async initDraft({ players }: InitDraftArgs) {
		const exists = await this.redisBridge.getDraft(this.connect);
		if (exists && exists.phase === "picking")
			return "draft-already-in-progress";

		if (players.length < PLAYER_COUNT) return "not-enough-players";

		// randomly select captains
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
			guildId: this.connect.guildId,
			channelId: this.connect.channelId,
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

	public async pickPlayer({ captainId, playerId }: PickPlayerArgs) {
		const draft = await this.redisBridge.getDraft(this.connect);
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

	public async cancelDraft() {
		const draft = await this.redisBridge.getDraft(this.connect);
		if (!draft) return "draft-not-found";
		if (draft.phase !== "picking") return "draft-not-in-progress";

		draft.phase = "cancelled";
		await this.redisBridge.saveDraft(draft);
		return draft;
	}
}

export class RedisBridge {
	constructor(private redisInstance: typeof redis) {}
	public async cancelDraft(guildId: string, channelId: string) {
		await this.redisInstance.del(getDraftKey(guildId, channelId));
	}

	public async getDraft({
		channelId,
		guildId,
	}: { guildId: string; channelId: string }) {
		const raw = await this.redisInstance.get(getDraftKey(guildId, channelId));
		return raw ? (JSON.parse(raw) as Draft) : null;
	}

	public async saveDraft(draft: Draft) {
		console.log("Saving draft", JSON.stringify(draft, null, 2));

		await this.redisInstance.set(
			getDraftKey(draft.guildId, draft.channelId),
			JSON.stringify(draft),
			"EX",
			3600,
		);

		return draft;
	}
}

const getDraftKey = (guildId: string, channelId: string) =>
	`draft:${guildId}:${channelId}`;

type InitDraftArgs = {
	players: Player[];
};

type PickPlayerArgs = {
	captainId: string;
	playerId: string;
};
