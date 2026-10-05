import type { QuotaRenderModel } from "./model";
import { textSvg } from "./text";
import { doubleRingSvg } from "./double-ring";

export interface Presentation {
	readonly id: string;
	readonly label: string;
	readonly render: (model: QuotaRenderModel) => string;
}

export const presentations: readonly Presentation[] = [
	{ id: "text", label: "Text", render: textSvg },
	{ id: "double-ring", label: "Double ring", render: doubleRingSvg },
];

export function resolvePresentation(id: unknown, catalog: readonly Presentation[] = presentations): Presentation {
	return catalog.find(item => item.id === id) ?? catalog.find(item => item.id === "text") ?? presentations[0]!;
}

export function presentationOptions(catalog: readonly Presentation[] = presentations): readonly { id: string; label: string }[] {
	return catalog.map(({ id, label }) => ({ id, label }));
}
