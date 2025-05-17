import type { CommandInteraction } from "discord.js";
import type { DraftManager } from "../../services/draft-manager";

export const cancelDraft = async (
	interaction: CommandInteraction,
	draftManager: DraftManager,
) => {
	if (!interaction.guildId) {
		return interaction.reply({
			content: "This command can only be used in a server.",
		});
	}

	await interaction.reply("Cancelling draft...");

	const cancelDraftResponse = await draftManager.cancelDraft();

	if (typeof cancelDraftResponse === "string") {
		return interaction.editReply(cancelDraftResponse);
	}

	return interaction.editReply("Draft cancelled!");
};
