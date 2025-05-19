import { describe, it, expect, beforeEach } from "vitest";
import { PLAYER_COUNT } from "../constants";
import type { IDraftRepository } from "../repositories/draft-repository";
import type { Player, Draft } from "../types";
import { DraftManager } from "./draft-manager";

const makePlayer = (id: string): Player => ({
	id,
	name: `Player${id}`,
	roles: [],
});

const mockConnect = {
	guildId: "guild1",
	channelId: "channel1",
};

describe("DraftManager", () => {
	let repo: ReturnType<typeof createMockRepository>;
	let manager: DraftManager;

	const createMockRepository = () => {
		let draft: Draft | null = null;
		return {
			get: async () => draft,
			save: async (d: Draft) => {
				draft = d;
				return d;
			},
			clear: () => {
				draft = null;
			},
			_getInternal: () => draft,
		} as IDraftRepository & {
			clear: () => void;
			_getInternal: () => Draft | null;
		};
	};

	beforeEach(() => {
		repo = createMockRepository();
		manager = new DraftManager(repo, mockConnect);
	});

	it("initializes a draft successfully with 10 players", async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		const result = await manager.initDraft({ players });
		expect(typeof result).toBe("object");
		expect(repo._getInternal()).not.toBeNull();
		expect(repo._getInternal()?.players.length).toBe(PLAYER_COUNT);
	});

	it('returns "not-enough-players" if fewer than 10', async () => {
		const players = Array.from({ length: 5 }, (_, i) =>
			makePlayer(i.toString()),
		);
		const result = await manager.initDraft({ players });
		expect(result).toBe("not-enough-players");
	});

	it('returns "duplicate-players" if player IDs are not unique', async () => {
		const players = [
			...Array.from({ length: 9 }, (_, i) => makePlayer(i.toString())),
			makePlayer("0"), // duplicate
		];
		const result = await manager.initDraft({ players });
		expect(result).toBe("duplicate-players");
	});

	it('returns "draft-already-in-progress" if one already exists', async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		await manager.initDraft({ players });
		const result = await manager.initDraft({ players });
		expect(result).toBe("draft-already-in-progress");
	});

	it("allows captains to pick players in order", async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		await manager.initDraft({ players });
		const draft = repo._getInternal()!;

		const nextPlayer = draft.availablePlayers[0];
		const result = await manager.pickPlayer({
			captainId: draft.turnOrder[0],
			playerId: nextPlayer.id,
		});
		expect(result).toBeDefined();
		expect((result as Draft).teams[draft.turnOrder[0]].length).toBe(1);
		expect((result as Draft).availablePlayers.length).toBe(PLAYER_COUNT - 3);
	});

	it('returns "draft-not-found" if no draft exists when picking', async () => {
		const result = await manager.pickPlayer({ captainId: "x", playerId: "y" });
		expect(result).toBe("draft-not-found");
	});

	it('returns "player-not-available" if picked player is missing', async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		await manager.initDraft({ players });
		const draft = repo._getInternal()!;
		const badPlayerId = "nonexistent";
		const result = await manager.pickPlayer({
			captainId: draft.turnOrder[0],
			playerId: badPlayerId,
		});
		expect(result).toBe("player-not-available");
	});

	it("marks draft as complete after all picks", async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		await manager.initDraft({ players });
		const draft = repo._getInternal()!;

		for (const turn of draft.turnOrder) {
			const pick = draft.availablePlayers[0];
			await manager.pickPlayer({ captainId: turn, playerId: pick.id });
		}

		expect(repo._getInternal()?.phase).toBe("complete");
	});

	it("cancels a draft successfully", async () => {
		const players = Array.from({ length: PLAYER_COUNT }, (_, i) =>
			makePlayer(i.toString()),
		);
		await manager.initDraft({ players });

		const result = await manager.cancelDraft();
		expect((result as Draft).phase).toBe("cancelled");
	});

	it('returns "draft-not-found" if cancel called on non-existent draft', async () => {
		const result = await manager.cancelDraft();
		expect(result).toBe("draft-not-found");
	});
});
