import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from "discord.js";
import type { Draft, Player } from "../types";
import { createButtonId } from "../utils/button-id.js";

const formatPlayer = (player: {
	name: string;
}) => `• **${player.name}**`;

export function buildDraftEmbed(draft: Draft) {
	const embed = new EmbedBuilder()
		.setTitle("🟢 Current Draft State")
		.setColor(0x00ff99);

	const teamA = draft.teams[draft.captains[0].id] || [];
	const teamB = draft.teams[draft.captains[1].id] || [];

	const teamAList = [
		`👑 **Captain**: ${draft.captains[0].name}`,
		...teamA.map(formatPlayer),
	].join("\n");

	const teamBList = [
		`👑 **Captain**: ${draft.captains[1].name}`,
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

export function buildPlayerButtons(players: Player[]) {
	const rows: ActionRowBuilder<ButtonBuilder>[] = [];

	for (let i = 0; i < players.length; i += 5) {
		const row = new ActionRowBuilder<ButtonBuilder>();
		const chunk = players.slice(i, i + 5);

		for (const player of chunk) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(createButtonId("pick", player.id))
					.setLabel(player.name)
					.setStyle(ButtonStyle.Primary),
			);
		}

		rows.push(row);
	}

	return rows;
}
