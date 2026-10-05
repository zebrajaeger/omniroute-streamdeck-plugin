import type { QuotaRenderModel } from "./model";
import { shorten, svg, text } from "./svg";

export function doubleRingSvg(model: QuotaRenderModel): string {
	const status = model.message.length || !model.rows.length;
	const rings = status ? "" : model.rows.map((row, i) => {
		const radius = i ? 19 : 26;
		const circumference = 2 * Math.PI * radius;
		const color = i ? "#a78bfa" : "#38bdf8";
		const track = `<circle cx="36" cy="29" r="${radius}" fill="none" stroke="#475569" stroke-width="4"${row.percentage.kind === "unknown" ? ' stroke-dasharray="1 3"' : ""}/>`;
		if (row.percentage.kind !== "limited") return track + (row.percentage.kind === "unlimited" ? `<circle cx="36" cy="29" r="${radius}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3 4"/>` : "");
		if (!row.percentage.value) return track;
		return track + `<circle cx="36" cy="29" r="${radius}" fill="none" stroke="${color}" stroke-width="4"${row.percentage.value === 100 ? "" : ` stroke-dasharray="${circumference * row.percentage.value / 100} ${circumference}"`} transform="rotate(-90 36 29)"/>`;
	}).join("");
	return svg(`${rings}${text(shorten(model.displayName, 9), 36, 29, 8, 36, "middle")}${model.plan ? text(shorten(model.plan, 10), 36, 37, 6, 32, "middle") : ""}${model.message.map((line, i) => text(line, 36, 43 + i * 10, 9, 60, "middle")).join("")}${status ? "" : model.rows.map((row, i) => text(`${shorten(row.label, 4)} ${row.value}`, i ? 53 : 19, 60, 7, 34, "middle")).join("")}<g fill="${model.warning ? "#fbbf24" : "#cbd5e1"}">${model.footer ? text(model.footer, 36, 69, 6, 68, "middle") : ""}</g>`);
}
