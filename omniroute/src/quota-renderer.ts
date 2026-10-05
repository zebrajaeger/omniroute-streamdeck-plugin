import type { QuotaPercentage } from "./quota-model";
import type { QuotaState, QuotaStatus } from "./quota-service";

export interface QuotaRenderModel {
	readonly heading: string;
	readonly plan: string;
	readonly rows: readonly { readonly label: string; readonly value: string }[];
	readonly message: readonly string[];
	readonly footer: string;
	readonly warning: boolean;
}

const errors: Partial<Record<QuotaStatus, string>> = {
	authentication: "API-Key", unavailable: "Offline", http: "HTTP", "invalid-response": "Datenfehler",
};

/** Compare Unicode code points, not response order, locale, or UTF-16 code units. */
function compareKeys(a: string, b: string): number {
	const left = Array.from(a, char => char.codePointAt(0)!);
	const right = Array.from(b, char => char.codePointAt(0)!);
	for (let i = 0; i < Math.min(left.length, right.length); i++) {
		if (left[i] !== right[i]) return left[i]! - right[i]!;
	}
	return left.length - right.length;
}

function shorten(text: string, limit: number): string {
	const chars = Array.from(text.replace(/[\u0000-\u001f\u007f-\u009f]/g, " "));
	return chars.length <= limit ? chars.join("") : chars.slice(0, limit - 1).join("") + "…";
}

function percentage(value: QuotaPercentage): string {
	return value.kind === "unlimited" ? "∞" : value.kind === "unknown" ? "?" : `${Math.round(value.value)}%`;
}

export function quotaRenderModel(state: QuotaState, connectionId: unknown): QuotaRenderModel {
	const status = (message: string[]): QuotaRenderModel => ({ heading: "Quota", plan: "", rows: [], message, footer: "", warning: true });
	if (typeof connectionId !== "string" || !connectionId.trim()) return status(["Auswählen"]);
	if (state.status === "unconfigured") return status(["Verbindung"]);
	if (state.status === "invalid-configuration") return status(["URL ungültig"]);
	const provider = state.snapshot?.get(connectionId);
	const error = errors[state.error ?? state.status];
	if (!provider) {
		if (error) return status([error]);
		return state.snapshot ? status(["Verbindung", "fehlt"]) : status(["Laden"]);
	}
	// A retained snapshot may only be used as stale data during an error.
	if (error && !state.stale) return status([error]);
	const keys = Object.keys(provider.quotas).sort(compareKeys);
	const selected = keys.slice(0, 2);
	let labels = selected.map(key => key === "session" ? "S" : key === "weekly" ? "W" : shorten(key || "?", 5));
	if (labels.length === 2 && labels[0] === labels[1]) labels = labels.map((label, i) => `${Array.from(label).slice(0, 3).join("")}…${i + 1}`);
	const overflow = keys.length > 2 ? `+${keys.length - 2}` : "";
	return {
		heading: shorten(provider.provider, 11), plan: shorten(provider.plan ?? "", 12),
		rows: selected.map((key, i) => ({ label: labels[i]!, value: percentage(provider.quotas[key]!.percentage) })),
		message: keys.length ? [] : ["Quota ?"],
		footer: [state.stale ? `Alt ${error === "Datenfehler" ? "Daten" : error ?? "Fehler"}` : "", overflow].filter(Boolean).join(" · "),
		warning: state.stale,
	};
}

function escapeXml(value: string): string {
	// XML 1.0 forbids lone surrogates and noncharacters as well as most control characters.
	return value.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, "�")
		.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function quotaSvg(model: QuotaRenderModel): string {
	const text = (value: string, x: number, y: number, size: number, width: number, anchor = "start") =>
		`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" textLength="${Math.min(width, Array.from(value).length * size * 0.65)}" lengthAdjust="spacingAndGlyphs">${escapeXml(value)}</text>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="6" fill="#111827"/><g fill="#f9fafb" font-family="Arial, sans-serif">${text(model.heading, 36, 13, 10, 64, "middle")}${model.plan ? text(model.plan, 36, 24, 8, 64, "middle") : ""}${model.rows.map((row, i) => text(row.label, 4, 39 + i * 17, 9, 27) + text(row.value, 68, 39 + i * 17, 14, 34, "end")).join("")}${model.message.map((line, i) => text(line, 36, 40 + i * 13, 10, 64, "middle")).join("")}<g fill="${model.warning ? "#fbbf24" : "#cbd5e1"}">${model.footer ? text(model.footer, 36, 68, 8, 64, "middle") : ""}</g></g></svg>`;
}

export function quotaImage(state: QuotaState, connectionId: unknown): string {
	return `data:image/svg+xml;base64,${Buffer.from(quotaSvg(quotaRenderModel(state, connectionId))).toString("base64")}`;
}
