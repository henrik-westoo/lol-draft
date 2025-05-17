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

	// bots dont have globalName
	if (interaction.options.data.some((option) => !option.user?.globalName)) {
		return interaction.editReply({
			content: "One user is missing globalName, cannot start draft.",
		});
	}

	const initDraftResponse = await draftManager.initDraft({
		players: interaction.options.data.map((option) => {
			return {
				id: option.user!.id,
				name: option.user!.globalName!,
			};
		}),
	});

	if (typeof initDraftResponse === "string") {
		let msg = "❌ ";

		switch (initDraftResponse) {
			case "draft-already-in-progress":
				msg += "Draft already in progress.";
				break;
			case "not-enough-players":
				msg += "Not enough players.";
				break;
			case "duplicate-players":
				msg += "Duplicate players.";
				break;
		}
		return interaction.editReply({
			content: msg,
		});
	}

	await interaction.editReply({
		embeds: [buildDraftEmbed(initDraftResponse)],
		content: `<@${initDraftResponse.turnOrder[initDraftResponse.currentTurnIndex]}>, your turn to pick!`,
		components: buildPlayerButtons(initDraftResponse.availablePlayers),
	});
};
