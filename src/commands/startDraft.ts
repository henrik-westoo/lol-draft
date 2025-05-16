import type { CommandInteraction } from "discord.js";
import type { DraftManager } from "../draft/DraftManager";

export const startDraft = async (
	interaction: CommandInteraction,
	draftManager: DraftManager,
) => {
	if (!interaction.guildId) {
		return interaction.reply({
			content: "This command can only be used in a server.",
		});
	}

	await interaction.reply("Starting draft...");

	console.log("players: ", interaction.options.data);

	const initDraftResponse = await draftManager.initDraft({
		channelId: interaction.channelId,
		players: interaction.options.data.map((player) => {
			return {
				id: player.value!.toString(),
				username: player.name,
				mainRole: "jungle",
				offRole: "top",
			};
		}),
		guildId: interaction.guildId,
	});

	if (typeof initDraftResponse === "string") {
		return interaction.editReply(initDraftResponse);
	}

	return interaction.editReply(
		`Draft started! Players: ${initDraftResponse.players
			.map((player) => player.username)
			.join(", ")}`,
	);
};
