import type { redis } from "../redis";
import type { Draft } from "../types";

export interface IDraftRepository {
	get: (args: { guildId: string; channelId: string }) => Promise<Draft | null>;
	save: (draft: Draft) => Promise<Draft>;
}

// 24 hrs
const ttl = 86400 as const;

export class DraftRepository implements IDraftRepository {
	constructor(private redisInstance: typeof redis) {}

	private getKey(guildId: string, channelId: string) {
		return `draft:${guildId}:${channelId}`;
	}

	public async get({
		channelId,
		guildId,
	}: { guildId: string; channelId: string }) {
		const raw = await this.redisInstance.get(this.getKey(guildId, channelId));
		return raw ? (JSON.parse(raw) as Draft) : null;
	}

	public async save(draft: Draft) {
		console.log("Saving draft", JSON.stringify(draft, null, 2));

		await this.redisInstance.set(
			this.getKey(draft.guildId, draft.channelId),
			JSON.stringify(draft),
			"EX",
			ttl,
		);

		return draft;
	}
}
