import { EmbedBuilder } from "discord.js";
import type { Draft } from "../types";

export function buildDraftEmbed(draft: Draft) {
	const embed = new EmbedBuilder()
		.setTitle("🟢 Current Draft State")
		.setColor(0x00ff99);

	const teamA = draft.teams[draft.captains[0].id] || [];
	const teamB = draft.teams[draft.captains[1].id] || [];

	const formatPlayer = (player: {
		username: string;
		mainRole: string;
		offRole: string;
	}) =>
		`• **${player.username}** — Main: ${player.mainRole}, Off: ${player.offRole}`;

	const teamAList = [
		`👑 **Captain**: ${draft.captains[0].username}`,
		...teamA.map(formatPlayer),
	].join("\n");

	const teamBList = [
		`👑 **Captain**: ${draft.captains[1].username}`,
		...teamB.map(formatPlayer),
	].join("\n");

	embed.addFields(
		{
			name: "🟦 Blue team",
			value: teamAList || "_No picks yet_",
			inline: true,
		},
		{
			name: "🟥 Red team",
			value: teamBList || "_No picks yet_",
			inline: true,
		},
	);

	const availableList = draft.availablePlayers.length
		? draft.availablePlayers.map(formatPlayer).join("\n")
		: "_No players left_";

	embed.addFields({
		name: "🟢 Available Players",
		value: availableList,
	});

	return embed;
}

import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import type { Player } from "../types.js";

export function buildPlayerButtons(players: Player[]) {
	const rows: ActionRowBuilder<ButtonBuilder>[] = [];

	for (let i = 0; i < players.length; i += 5) {
		const row = new ActionRowBuilder<ButtonBuilder>();
		const chunk = players.slice(i, i + 5);

		for (const player of chunk) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`pick_${player.id}`)
					.setLabel(player.username)
					.setStyle(ButtonStyle.Primary),
			);
		}

		rows.push(row);
	}

	return rows;
}
