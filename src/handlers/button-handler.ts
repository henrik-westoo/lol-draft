import { MessageFlags, type ButtonInteraction } from "discord.js";
import type { DraftManager } from "../services/draft-manager";
import { buildDraftEmbed, buildPlayerButtons } from "../ui/ui.js";
import { readButtonId } from "../utils/button-id.js";

export const buttonCommandHandler = async (
	interaction: ButtonInteraction,
	draftManager: DraftManager,
) => {
	const { prefix, id } = readButtonId(interaction.customId);

	console.log(
		`🔘 Button command: ${prefix}, issued by ${interaction.user.globalName} (${interaction.user.id})`,
	);

	switch (prefix) {
		case "pick": {
			await interaction.deferUpdate();
			await interaction.deferReply({
				flags: MessageFlags.Ephemeral,
			});

			const pickPlayerResponse = await draftManager.pickPlayer({
				captainId: interaction.user.id,
				playerId: id,
			});

			if (typeof pickPlayerResponse === "string") {
				switch (pickPlayerResponse) {
					case "draft-not-found":
						return interaction.editReply({
							content: "❌ Draft not found.",
						});
					case "draft-not-in-progress":
						return interaction.editReply({
							content: "❌ Draft is not in progress.",
						});
					case "player-not-available":
						return interaction.editReply({
							content: "❌ Player is not available.",
						});
					case "invalid-captain-turn":
						return interaction.editReply({
							content:
								"❌ Invalid action. Either you are not the captain or it is not your turn.",
						});
				}
			}

			const playerName =
				pickPlayerResponse!.turnOrder[pickPlayerResponse!.currentTurnIndex];

			return interaction.update({
				content: playerName
					? `<@${playerName}>, your turn!`
					: "All done! Thank you for using donger-draft.",
				embeds: [buildDraftEmbed(pickPlayerResponse!)],
				components: buildPlayerButtons(pickPlayerResponse!.availablePlayers),
			});
		}
		default:
			return interaction.editReply({
				content: `Unknown button command: ${interaction.customId}`,
			});
	}
};
