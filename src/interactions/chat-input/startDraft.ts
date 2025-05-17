import type { CommandInteraction } from "discord.js";
import type { DraftManager } from "../../draft/DraftManager";
import { buildDraftEmbed, buildPlayerButtons } from "../../ui/ui.js";

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
			return {
				id: option.user!.id,
				name: option.user!.globalName!,
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
		components: buildPlayerButtons(initDraftResponse.availablePlayers),
	});
};
