import type { QuotaRenderModel } from "./model";
import { shorten, svg, text } from "./svg";

export function doubleRingSvg(model: QuotaRenderModel): string {
	const status = model.message.length || !model.rows.length;
	// Reserve the bottom strip only when a stale or overflow indicator is needed.
	const centerY = model.footer ? 32 : 36;
	const outerRadius = model.footer ? 29 : 32;
	const rings = status ? "" : model.rows.map((row, i) => {
		const radius = outerRadius - (i ? 8 : 0);
		const circumference = 2 * Math.PI * radius;
		const color = i ? "#a78bfa" : "#38bdf8";
		const track = `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="#475569" stroke-width="4"${row.percentage.kind === "unknown" ? ' stroke-dasharray="1 3"' : ""}/>`;
		if (row.percentage.kind !== "limited") return track + (row.percentage.kind === "unlimited" ? `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3 4"/>` : "");
		if (!row.percentage.value) return track;
		return track + `<circle cx="36" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="4"${row.percentage.value === 100 ? "" : ` stroke-dasharray="${circumference * row.percentage.value / 100} ${circumference}"`} transform="rotate(-90 36 ${centerY})"/>`;
	}).join("");
	// Outer window first, inner window second; only special values need a glyph.
	const legend = status ? "" : model.rows.map(row => `${shorten(row.label, 5)}${row.percentage.kind === "limited" ? "" : ` ${row.value}`}`).join(" / ");
	return svg(`${rings}${text(shorten(model.displayName, 9), 36, centerY - 6, 8, 36, "middle")}${model.plan ? text(shorten(model.plan, 10), 36, centerY + 2, 6, 34, "middle") : ""}${model.message.map((line, i) => text(line, 36, 43 + i * 10, 9, 60, "middle")).join("")}${legend ? text(legend, 36, centerY + 11, 5, model.footer ? 32 : 38, "middle") : ""}<g fill="${model.warning ? "#fbbf24" : "#cbd5e1"}">${model.footer ? text(model.footer, 36, 70, 6, 68, "middle") : ""}</g>`);
}
