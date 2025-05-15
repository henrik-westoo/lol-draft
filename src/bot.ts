import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { redis } from "./redis.js";
import { DraftManager, RedisBridge } from "./draft/DraftManager.js";

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

	const { commandName } = interaction;

	if (commandName === "startdraft") {
		await redis.set("test-key", "hello");
		const value = await redis.get("test-key");
		console.log(value); // Should print: hello
		await interaction.reply("🛠 Draft setup coming soon!");
		// Later: initialize DraftManager here

		const draftManager = new DraftManager(new RedisBridge(redis));
		console.log("players: ", interaction.options.data);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
