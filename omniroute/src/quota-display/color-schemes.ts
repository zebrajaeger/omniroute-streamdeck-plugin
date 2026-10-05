export interface ColorScheme {
	readonly id: string;
	readonly label: string;
	readonly outer: string;
	readonly inner: string;
}

export const colorSchemes: readonly ColorScheme[] = [
	{ id: "classic", label: "Classic (cyan / violet)", outer: "#38bdf8", inner: "#a78bfa" },
	{ id: "warm", label: "Warm (amber / turquoise)", outer: "#fbbf24", inner: "#2dd4bf" },
	{ id: "vivid", label: "Vivid (lime / pink)", outer: "#a3e635", inner: "#f472b6" },
	{ id: "sunset", label: "Sunset (orange / lavender)", outer: "#fb923c", inner: "#c084fc" },
	{ id: "ocean", label: "Ocean (aqua / gold)", outer: "#22d3ee", inner: "#fbbf24" },
	{ id: "forest", label: "Forest (green / rose)", outer: "#4ade80", inner: "#fda4af" },
	{ id: "royal", label: "Royal (indigo / yellow)", outer: "#818cf8", inner: "#facc15" },
	{ id: "ember", label: "Ember (coral / ice blue)", outer: "#fb7185", inner: "#67e8f9" },
	{ id: "orchid", label: "Orchid (magenta / mint)", outer: "#e879f9", inner: "#86efac" },
	{ id: "solar", label: "Solar (yellow / pink)", outer: "#fde047", inner: "#f9a8d4" },
];

export function resolveColorScheme(id: unknown): ColorScheme {
	return colorSchemes.find(item => item.id === id) ?? colorSchemes[0]!;
}

export function colorSchemeOptions(): readonly { id: string; label: string }[] {
	return colorSchemes.map(({ id, label }) => ({ id, label }));
}
