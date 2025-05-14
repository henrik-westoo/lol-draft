import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
	new SlashCommandBuilder()
		.setName("startdraft")
		.setDescription("Start a League of Legends draft"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	process.env.DISCORD_BOT_TOKEN!,
);

(async () => {
	try {
		console.log("🔄 Refreshing application (/) commands...");

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID!), {
			body: commands,
		});

		console.log("✅ Successfully registered application commands.");
	} catch (error) {
		console.error(error);
	}
})();
