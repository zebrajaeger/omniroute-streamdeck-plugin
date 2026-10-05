import type { QuotaRenderModel } from "./model";
import { shorten, text } from "./svg";

/** Draw only explicit custom line breaks; keep the automatic and one-line layouts intact. */
export function nameBlock(model: QuotaRenderModel, centerY: number, size: number, width: number, limit: number, lineHeight: number, maxLines: number): string {
	if (!model.customName || !model.displayName.includes("\\n"))
		return text(shorten(model.displayName, limit), 36, centerY, size, width, "middle");
	const parts = model.displayName.split("\\n");
	const lines = parts.slice(0, maxLines).map(part => shorten(part, limit));
	if (parts.length > maxLines) lines[maxLines - 1] = shorten(`${parts[maxLines - 1]}…`, limit);
	return lines.map((line, i) => text(line, 36, centerY + (i - (lines.length - 1) / 2) * lineHeight, size, width, "middle")).join("");
}
