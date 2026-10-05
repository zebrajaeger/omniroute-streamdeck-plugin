import type { QuotaPercentage } from "../quota-model";
import type { QuotaState, QuotaStatus } from "../quota-service";
import { shorten } from "./svg";

export interface QuotaRenderModel {
	readonly heading: string;
	readonly providerName: string;
	readonly displayName: string;
	readonly customName: boolean;
	readonly plan: string;
	readonly rows: readonly { readonly key: string; readonly label: string; readonly value: string; readonly percentage: QuotaPercentage }[];
	readonly message: readonly string[];
	readonly footer: string;
	readonly warning: boolean;
}

export function normalizeDisplayName(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const name = value.trim();
	return name ? name : undefined;
}

const errors: Partial<Record<QuotaStatus, string>> = {
	authentication: "API-Key", unavailable: "Offline", http: "HTTP", "invalid-response": "Datenfehler",
};

function compareKeys(a: string, b: string): number {
	const left = Array.from(a, char => char.codePointAt(0)!);
	const right = Array.from(b, char => char.codePointAt(0)!);
	for (let i = 0; i < Math.min(left.length, right.length); i++) {
		if (left[i] !== right[i]) return left[i]! - right[i]!;
	}
	return left.length - right.length;
}

function percentage(value: QuotaPercentage): string {
	return value.kind === "unlimited" ? "∞" : value.kind === "unknown" ? "?" : `${Math.round(value.value)}%`;
}

export function quotaRenderModel(state: QuotaState, connectionId: unknown, displayName?: unknown): QuotaRenderModel {
	const status = (message: string[]): QuotaRenderModel => ({ heading: "Quota", providerName: "", displayName: "Quota", customName: false, plan: "", rows: [], message, footer: "", warning: true });
	if (typeof connectionId !== "string" || !connectionId.trim()) return status(["Auswählen"]);
	if (state.status === "unconfigured") return status(["Verbindung"]);
	if (state.status === "invalid-configuration") return status(["URL ungültig"]);
	const provider = state.snapshot?.get(connectionId);
	const error = errors[state.error ?? state.status];
	if (!provider) {
		if (error) return status([error]);
		return state.snapshot ? status(["Verbindung", "fehlt"]) : status(["Laden"]);
	}
	if (error && !state.stale) return status([error]);
	const keys = Object.keys(provider.quotas).sort(compareKeys);
	const selected = keys.slice(0, 2);
	let labels = selected.map(key => key === "session" ? "S" : key === "weekly" ? "W" : shorten(key || "?", 5));
	if (labels.length === 2 && labels[0] === labels[1]) labels = labels.map((label, i) => `${Array.from(label).slice(0, 3).join("")}…${i + 1}`);
	const overflow = keys.length > 2 ? `+${keys.length - 2}` : "";
	const custom = normalizeDisplayName(displayName);
	const name = custom ?? provider.provider;
	return {
		heading: shorten(name, 11), providerName: provider.provider, displayName: name, customName: !!custom, plan: shorten(provider.plan ?? "", 12),
		rows: selected.map((key, i) => ({ key, label: labels[i]!, value: percentage(provider.quotas[key]!.percentage), percentage: provider.quotas[key]!.percentage })),
		message: keys.length ? [] : ["Quota ?"],
		footer: [state.stale ? `Alt ${error === "Datenfehler" ? "Daten" : error ?? "Fehler"}` : "", overflow].filter(Boolean).join(" · "),
		warning: state.stale,
	};
}
