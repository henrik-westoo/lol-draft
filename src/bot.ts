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

	switch (interaction.commandName) {
		case "startdraft":
			return COMMANDS.startDraft(
				interaction,
				new DraftManager(new RedisBridge(redis)),
			);

		case "canceldraft":
			return COMMANDS.cancelDraft(
				interaction,
				new DraftManager(new RedisBridge(redis)),
			);
		default:
			return interaction.reply({
				content: `Unknown command: ${interaction.commandName}`,
			});
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
