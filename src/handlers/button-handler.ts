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
			const pickPlayerResponse = await draftManager.pickPlayer({
				captainId: interaction.user.id,
				playerId: id,
			});

			if (typeof pickPlayerResponse === "string") {
				let errorMsg = "❌ ";
				switch (pickPlayerResponse) {
					case "draft-not-found":
						errorMsg += "Draft not found.";
						break;
					case "draft-not-in-progress":
						errorMsg += "Draft is not in progress.";
						break;
					case "player-not-available":
						errorMsg += "Player is not available.";
						break;
					case "invalid-captain-turn":
						errorMsg += "You're not the captain or it's not your turn.";
						break;
				}

				return interaction.followUp({
					content: errorMsg,
					flags: MessageFlags.Ephemeral,
				});
			}

			const playerName =
				pickPlayerResponse.turnOrder[pickPlayerResponse.currentTurnIndex];

			return interaction.update({
				content: playerName
					? `<@${playerName}>, your turn!`
					: "All done! Thank you for using donger-draft.",
				embeds: [buildDraftEmbed(pickPlayerResponse)],
				components: buildPlayerButtons(pickPlayerResponse.availablePlayers),
			});
		}

		default:
			return interaction.editReply({
				content: `Unknown button command: ${interaction.customId}`,
			});
	}
};
