import { PLAYER_COUNT } from "../constants.js";
import { randomUUID } from "node:crypto";
import type { Player, Draft } from "../types.js";
import type { DraftRepository } from "../repositories/draft-repository.js";

type InitDraftArgs = {
	players: Player[];
};

type PickPlayerArgs = {
	captainId: string;
	playerId: string;
};

export class DraftManager {
	constructor(
		private draftRepository: DraftRepository,
		private connect: {
			guildId: string;
			channelId: string;
		},
	) {}

	public async initDraft({ players }: InitDraftArgs) {
		const exists = await this.draftRepository.get(this.connect);
		if (exists && exists.phase === "picking")
			return "draft-already-in-progress";

		if (players.length < PLAYER_COUNT) return "not-enough-players";
		if (new Set(players.map((p) => p.id)).size !== players.length)
			return "duplicate-players";

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

		return this.draftRepository.save(draft);
	}

	public async pickPlayer({ captainId, playerId }: PickPlayerArgs) {
		const draft = await this.draftRepository.get(this.connect);
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

		await this.draftRepository.save(draft);
		return draft;
	}

	public async cancelDraft() {
		const draft = await this.draftRepository.get(this.connect);
		if (!draft) return "draft-not-found";
		if (draft.phase !== "picking") return "draft-not-in-progress";

		draft.phase = "cancelled";
		await this.draftRepository.save(draft);
		return draft;
	}
}
