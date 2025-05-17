import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { DraftManager } from "./services/draft-manager.js";
import { CHAT_INPUT_COMMANDS } from "./interactions/chat-input/index.js";
import { readButtonId } from "./utils/button-id.js";
import { DraftRepository } from "./repositories/draft-repository.js";
import { BUTTON_COMMANDS } from "./interactions/button/index.js";
import { registerCommands } from "./registerCommands.js";

dotenv.config();
// import redis after setting up dotenv
import { redis } from "./redis.js";

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
			`📜 Chat command: ${interaction.commandName}, issued by ${interaction.user.globalName}`,
		);
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

		console.log(
			`🔘 Button command: ${prefix}, issued by ${interaction.user.globalName}`,
		);

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
