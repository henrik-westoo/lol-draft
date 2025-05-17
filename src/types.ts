export type Player = {
	id: string;
	name: string;
	mainRole: string;
	offRole: string;
};

export type Draft = {
	guildId: string;
	channelId: string;
	draftId: string;
	players: Player[];
	captains: [Player, Player];
	teams: Record<string, Player[]>;
	availablePlayers: Player[];
	turnOrder: string[]; // array of captainIds
	currentTurnIndex: number;
	phase: "picking" | "complete" | "cancelled";
};
