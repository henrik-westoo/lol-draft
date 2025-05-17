import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { PLAYER_COUNT } from "./constants.js";

dotenv.config();

const startDraftCommand = new SlashCommandBuilder()
	.setName("startdraft")
	.setDescription(
		`Start a League of Legends draft with ${PLAYER_COUNT} players`,
	);

for (let i = 0; i < PLAYER_COUNT; i++) {
	startDraftCommand.addUserOption((option) =>
		option
			.setName(`player${i + 1}`)
			.setDescription(`Player ${i + 1}`)
			.setRequired(true),
	);
}

const cancelDraftCommand = new SlashCommandBuilder()
	.setName("canceldraft")
	.setDescription("Cancel the current draft");

const commands = [startDraftCommand, cancelDraftCommand].map((command) =>
	command.toJSON(),
);

const rest = new REST({ version: "10" }).setToken(
	process.env.DISCORD_BOT_TOKEN!,
);

(async () => {
	try {
		console.log("🔄 Refreshing application (/) commands...");

		await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID!), {
			body: commands,
		});

		console.log("✅ Successfully registered application commands.");
	} catch (error) {
		console.error(error);
	}
})();
