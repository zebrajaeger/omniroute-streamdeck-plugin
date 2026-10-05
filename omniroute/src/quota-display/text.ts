import type { QuotaRenderModel } from "./model";
import { svg, text } from "./svg";
import { nameBlock } from "./name";

export function textSvg(model: QuotaRenderModel): string {
	return svg(`${model.customName && model.displayName.includes("\\n") ? nameBlock(model, 13, model.plan ? 7 : 8, 64, 11, model.plan ? 6 : 8, model.plan ? 2 : 3) : text(model.heading, 36, 13, 10, 64, "middle")}${model.plan ? text(model.plan, 36, 24, 8, 64, "middle") : ""}${model.rows.map((row, i) => text(row.label, 4, 39 + i * 17, 9, 27) + text(row.value, 68, 39 + i * 17, 14, 34, "end")).join("")}${model.message.map((line, i) => text(line, 36, 40 + i * 13, 10, 64, "middle")).join("")}<g fill="${model.warning ? "#fbbf24" : "#cbd5e1"}">${model.footer ? text(model.footer, 36, 68, 8, 64, "middle") : ""}</g>`);
}
