import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import type { DraftManager } from "../services/draft-manager";
import { buildDraftEmbed, buildPlayerButtons } from "../ui/ui.js";

export const chatInputCommandHandler = async (
	interaction: ChatInputCommandInteraction,
	draftManager: DraftManager,
) => {
	console.log(
		`📜 Chat command: ${interaction.commandName}, issued by ${interaction.user.globalName} (${interaction.user.id})`,
	);

	switch (interaction.commandName) {
		case "startdraft": {
			// bots dont have globalName
			if (interaction.options.data.some((option) => !option.user?.globalName)) {
				return interaction.reply({
					content:
						"❌ One user is missing globalName, cannot start draft. Maybe the user was a bot?",
					flags: MessageFlags.Ephemeral,
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
				return interaction.reply({
					content: msg,
					flags: MessageFlags.Ephemeral,
				});
			}

			return interaction.reply({
				embeds: [buildDraftEmbed(initDraftResponse)],
				content: `<@${initDraftResponse.turnOrder[initDraftResponse.currentTurnIndex]}>, your turn to pick!`,
				components: buildPlayerButtons(initDraftResponse.availablePlayers),
			});
		}
		case "canceldraft": {
			await interaction.deferReply();
			const cancelDraftResponse = await draftManager.cancelDraft();

			if (typeof cancelDraftResponse === "string") {
				let msg = "❌ ";
				switch (cancelDraftResponse) {
					case "draft-not-found":
						msg += "Draft not found.";
						break;
					case "draft-not-in-progress":
						msg += "Draft is not in progress.";
						break;
				}

				return interaction.editReply({
					content: msg,
				});
			}
			return interaction.editReply({
				content: "Draft cancelled.",
			});
		}
		default:
			return interaction.editReply({
				content: `Unknown command: ${interaction.commandName}`,
			});
	}
};
