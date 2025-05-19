import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { DraftManager } from "./services/draft-manager.js";
import { DraftRepository } from "./repositories/draft-repository.js";
import { registerCommands } from "./registerCommands.js";
import { chatInputCommandHandler } from "./handlers/chat-input-command-handler.js";
import { buttonCommandHandler } from "./handlers/button-handler.js";

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

const busyChannels = new Set<string>(); // channel IDs with ongoing requests

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

	if (busyChannels.has(interaction.channelId))
		return interaction.reply({
			content:
				"Another request is being processed in this channel. Please wait.",
		});

	busyChannels.add(interaction.channelId);

	const draftManager = new DraftManager(new DraftRepository(redis), {
		channelId: interaction.channelId,
		guildId: interaction.guildId,
	});

	switch (true) {
		case interaction.isChatInputCommand(): {
			await chatInputCommandHandler(interaction, draftManager);
			break;
		}
		case interaction.isButton(): {
			await buttonCommandHandler(interaction, draftManager);
			break;
		}
	}

	busyChannels.delete(interaction.channelId);
	return;
});

client.login(process.env.DISCORD_BOT_TOKEN);
