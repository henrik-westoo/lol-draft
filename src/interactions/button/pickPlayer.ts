import type { ButtonInteraction } from "discord.js";
import type { DraftManager } from "../../services/draft-manager";
import { buildDraftEmbed, buildPlayerButtons } from "../../ui/ui.js";

export const pickPlayer = async (
	interaction: ButtonInteraction,
	draftManager: DraftManager,
	playerId: string,
) => {
	const pickPlayerResponse = await draftManager.pickPlayer({
		captainId: interaction.user.id,
		playerId,
	});

	if (typeof pickPlayerResponse === "string") {
		switch (pickPlayerResponse) {
			case "draft-not-found":
				return interaction.reply({
					content: "❌ Draft not found.",
				});
			case "draft-not-in-progress":
				return interaction.reply({
					content: "❌ Draft is not in progress.",
				});
			case "player-not-available":
				return interaction.reply({
					content: "❌ Player is not available.",
				});
			case "invalid-captain-turn":
				return interaction.reply({
					content:
						"❌ Invalid action. Either you are not the captain or it is not your turn.",
				});
		}
	}

	return interaction.update({
		content: `<@${pickPlayerResponse!.turnOrder[pickPlayerResponse!.currentTurnIndex] || "all done"}>, your turn!`,
		embeds: [buildDraftEmbed(pickPlayerResponse!)],
		components: buildPlayerButtons(pickPlayerResponse!.availablePlayers),
	});
};
