import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { DraftManager } from "./services/draft-manager.js";
import { readButtonId } from "./utils/button-id.js";
import { DraftRepository } from "./repositories/draft-repository.js";
import { registerCommands } from "./registerCommands.js";

dotenv.config();
// import redis after setting up dotenv
import { redis } from "./redis.js";
import { buildDraftEmbed, buildPlayerButtons } from "./ui/ui.js";

redis.ping().then((res) => {
	console.log("Redis ping:", res);
});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds, // Required for slash commands and interactions
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

await registerCommands();

client.once("ready", (readyClient) => {
	console.log(`🤖 Logged in as ${readyClient.user.tag}`);
});

const activeDrafts = new Set<string>(); // channel IDs in progress

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand() && !interaction.isButton()) {
		console.log(
			`❌ Unknown interaction type: ${interaction.type}`,
			interaction.toString(),
		);
		return;
	}

	if (!interaction.guildId)
		return interaction.reply({
			content: "This command can only be used in a server.",
		});

	const draftManager = new DraftManager(new DraftRepository(redis), {
		channelId: interaction.channelId,
		guildId: interaction.guildId,
	});

	if (interaction.isChatInputCommand()) {
		console.log(
			`📜 Chat command: ${interaction.commandName}, issued by ${interaction.user.globalName} (${interaction.user.id})`,
		);
		switch (interaction.commandName) {
			case "startdraft": {
				await interaction.reply("Starting draft...");

				// bots dont have globalName
				if (interaction.options.data.some((option) => !option.user?.globalName))
					return interaction.editReply({
						content:
							"One user is missing globalName, cannot start draft. Maybe thet user was a bot?",
					});

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

				return interaction.editReply({
					embeds: [buildDraftEmbed(initDraftResponse)],
					content: `<@${initDraftResponse.turnOrder[initDraftResponse.currentTurnIndex]}>, your turn to pick!`,
					components: buildPlayerButtons(initDraftResponse.availablePlayers),
				});
			}
			case "canceldraft": {
				await interaction.reply("Cancelling draft...");
				const cancelDraftResponse = await draftManager.cancelDraft();
				if (typeof cancelDraftResponse === "string") {
					return interaction.editReply(cancelDraftResponse);
				}
				return interaction.editReply("Draft cancelled!");
			}
			default:
				return interaction.reply({
					content: `Unknown command: ${interaction.commandName}`,
				});
		}
	}
	if (interaction.isButton()) {
		const { prefix, id } = readButtonId(interaction.customId);

		console.log(
			`🔘 Button command: ${prefix}, issued by ${interaction.user.globalName}`,
		);

		switch (prefix) {
			case "pick": {
				const pickPlayerResponse = await draftManager.pickPlayer({
					captainId: interaction.user.id,
					playerId: id,
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
				return interaction.reply({
					content: `Unknown button command: ${interaction.customId}`,
				});
		}
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
