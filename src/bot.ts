import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { redis } from "./redis.js";
import { DraftManager, RedisBridge } from "./draft/DraftManager.js";
import { COMMANDS } from "./commands/index.js";

dotenv.config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds, // Required for slash commands and interactions
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`🤖 Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const getDraftManager = () => {
		return new DraftManager(new RedisBridge(redis), {
			channelId: interaction.channelId,
			guildId: interaction.guildId!,
		});
	};

	switch (interaction.commandName) {
		case "startdraft":
			return COMMANDS.startDraft(interaction, getDraftManager());
		case "canceldraft":
			return COMMANDS.cancelDraft(interaction, getDraftManager());
		default:
			return interaction.reply({
				content: `Unknown command: ${interaction.commandName}`,
			});
	}
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isButton()) return;

	const [action, playerId] = interaction.customId.split("_");

	if (action !== "pick") return;

	const draftManager = new DraftManager(new RedisBridge(redis), {
		channelId: interaction.channelId,
		guildId: interaction.guildId!,
	});

	const pickPlayerResponse = await draftManager.pickPlayer({
		captainId: interaction.user.id,
		playerId,
	});

	if (typeof pickPlayerResponse === "string") {
		switch (pickPlayerResponse) {
			case "draft-not-found":
				return interaction.reply({
					content: "❌ Draft not found.",
					ephemeral: true,
				});
			case "draft-not-in-progress":
				return interaction.reply({
					content: "❌ Draft is not in progress.",
					ephemeral: true,
				});
			case "player-not-available":
				return interaction.reply({
					content: "❌ Player is not available.",
					ephemeral: true,
				});
		}
	}

	// await interaction.update({
	// 	content: `<@${updatedDraft!.turnOrder[updatedDraft!.currentTurnIndex] || "all done"}>, your turn!`,
	// 	embeds: [buildDraftEmbed(updatedDraft!)],
	// 	components: buildPlayerButtons(updatedDraft!.availablePlayers),
	// });
});

client.login(process.env.DISCORD_BOT_TOKEN);
