import type { CommandInteraction } from "discord.js";
import type { DraftManager } from "../draft/DraftManager";
import { buildDraftEmbed, buildPlayerButtons } from "../ui/ui.js";

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

	const initDraftResponse = await draftManager.initDraft({
		players: interaction.options.data.map((option) => {
			console.log(option);
			return {
				id: option.user!.id,
				username: option.user!.globalName!,
				mainRole: "jungle",
				offRole: "top",
			};
		}),
	});

	if (typeof initDraftResponse === "string") {
		return interaction.editReply(initDraftResponse);
	}

	await interaction.editReply({
		embeds: [buildDraftEmbed(initDraftResponse)],
		content: `<@${initDraftResponse.turnOrder[initDraftResponse.currentTurnIndex]}>, your turn to pick!`,
		components: buildPlayerButtons([
			{ id: "1", username: "Player 1", mainRole: "jungle", offRole: "top" },
			{ id: "2", username: "Player 2", mainRole: "mid", offRole: "adc" },
			{ id: "3", username: "Player 3", mainRole: "support", offRole: "top" },
			{ id: "4", username: "Player 4", mainRole: "adc", offRole: "jungle" },
			{ id: "5", username: "Player 5", mainRole: "top", offRole: "mid" },
			{ id: "6", username: "Player 6", mainRole: "mid", offRole: "support" },
			{ id: "7", username: "Player 7", mainRole: "support", offRole: "adc" },
			{ id: "8", username: "Player 8", mainRole: "top", offRole: "jungle" },
		]),
	});
};
