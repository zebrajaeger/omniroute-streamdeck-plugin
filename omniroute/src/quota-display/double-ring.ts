import type { QuotaRenderModel } from "./model";
import type { ColorScheme } from "./color-schemes";
import { resolveColorScheme } from "./color-schemes";
import { svg, text } from "./svg";
import { nameBlock } from "./name";

export function doubleRingSvg(model: QuotaRenderModel, scheme: ColorScheme = resolveColorScheme(undefined)): string {
	const status = model.message.length || !model.rows.length;
	// Reserve the bottom strip only when a stale or overflow indicator is needed.
	const centerY = model.footer ? 32 : 36;
	const outerRadius = model.footer ? 29 : 32;
	const rings = status ? "" : model.rows.map((row, i) => {
		const radius = outerRadius - (i ? 8 : 0);
		const circumference = 2 * Math.PI * radius;
		const color = i ? scheme.inner : scheme.outer;
		const track = `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="#475569" stroke-width="4"${row.percentage.kind === "unknown" ? ' stroke-dasharray="1 3"' : ""}/>`;
		if (row.percentage.kind !== "limited") return track + (row.percentage.kind === "unlimited" ? `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3 4"/>` : "");
		if (!row.percentage.value) return track;
		return track + `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="4"${row.percentage.value === 100 ? "" : ` stroke-dasharray="${circumference * row.percentage.value / 100} ${circumference}"`} transform="rotate(-90 36 ${centerY})"/>`;
	}).join("");
	// Arial's visible glyphs sit above SVG's middle baseline, especially for two lines.
	const name = `<g dominant-baseline="middle">${nameBlock(model, centerY + (model.customName && model.displayName.includes("\\n") ? 1.5 : 1), 8, 36, 9, 9, 2)}</g>`;
	return svg(`${rings}${name}${model.message.map((line, i) => text(line, 36, 43 + i * 10, 9, 60, "middle")).join("")}<g fill="${model.warning ? "#fbbf24" : "#cbd5e1"}">${model.footer ? text(model.footer, 36, 70, 6, 68, "middle") : ""}</g>`);
}
