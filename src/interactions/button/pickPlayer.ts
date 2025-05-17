import type { ButtonInteraction, CommandInteraction } from "discord.js";
import type { DraftManager } from "../../draft/DraftManager";

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
		}
	}

	// await interaction.update({
	// 	content: `<@${updatedDraft!.turnOrder[updatedDraft!.currentTurnIndex] || "all done"}>, your turn!`,
	// 	embeds: [buildDraftEmbed(updatedDraft!)],
	// 	components: buildPlayerButtons(updatedDraft!.availablePlayers),
	// });
};
