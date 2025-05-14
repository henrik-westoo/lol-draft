import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

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
		await interaction.reply("🛠 Draft setup coming soon!");
		// Later: initialize DraftManager here
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
