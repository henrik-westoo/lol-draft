export const createButtonId = (prefix: string, id: string) => `${prefix}_${id}`;

export const readButtonId = (buttonId: string) => {
	const [prefix, id] = buttonId.split("_");

	return {
		prefix,
		id,
	};
};
