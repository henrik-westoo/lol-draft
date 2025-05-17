import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { redis } from "./redis.js";
import { DraftManager } from "./draft/DraftManager.js";
import { CHAT_INPUT_COMMANDS } from "./interactions/chat-input/index.js";
import { readButtonId } from "./utils/button-id.js";
import { RedisBridge } from "./services/redis-bridge.js";
import { BUTTON_COMMANDS } from "./interactions/button/index.js";
import { registerCommands } from "./registerCommands.js";

dotenv.config();

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

	const draftManager = new DraftManager(new RedisBridge(redis), {
		channelId: interaction.channelId,
		guildId: interaction.guildId,
	});

	if (interaction.isChatInputCommand()) {
		switch (interaction.commandName) {
			case "startdraft":
				return CHAT_INPUT_COMMANDS.startDraft(interaction, draftManager);
			case "canceldraft":
				return CHAT_INPUT_COMMANDS.cancelDraft(interaction, draftManager);
			default:
				return interaction.reply({
					content: `Unknown command: ${interaction.commandName}`,
				});
		}
	}
	if (interaction.isButton()) {
		const { prefix, id } = readButtonId(interaction.customId);

		switch (prefix) {
			case "pick":
				return BUTTON_COMMANDS.pickPlayer(interaction, draftManager, id);
			default:
				return interaction.reply({
					content: `Unknown button command: ${interaction.customId}`,
				});
		}
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
