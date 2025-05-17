import type { redis } from "../redis";
import type { Draft } from "../types";

// 24 hrs
const ttl = 86400 as const;

export class RedisBridge {
	constructor(private redisInstance: typeof redis) {}

	private getDraftKey(guildId: string, channelId: string) {
		return `draft:${guildId}:${channelId}`;
	}

	public async getDraft({
		channelId,
		guildId,
	}: { guildId: string; channelId: string }) {
		const raw = await this.redisInstance.get(
			this.getDraftKey(guildId, channelId),
		);
		return raw ? (JSON.parse(raw) as Draft) : null;
	}

	public async saveDraft(draft: Draft) {
		console.log("Saving draft", JSON.stringify(draft, null, 2));

		await this.redisInstance.set(
			this.getDraftKey(draft.guildId, draft.channelId),
			JSON.stringify(draft),
			"EX",
			ttl,
		);

		return draft;
	}
}
