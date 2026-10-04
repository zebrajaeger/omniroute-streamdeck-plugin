export type QuotaPercentage = Readonly<{ kind: "limited"; value: number } | { kind: "unlimited" } | { kind: "unknown" }>;

export interface QuotaWindow {
	readonly used?: number;
	readonly total?: number;
	readonly remaining?: number;
	readonly remainingPercentage?: number;
	readonly resetAt?: string;
	readonly unlimited?: boolean;
	readonly windowSeconds?: number;
	readonly percentage: QuotaPercentage;
}

export interface ProviderQuota {
	readonly connectionId: string;
	readonly provider: string;
	readonly plan?: string;
	readonly quotas: Readonly<Record<string, QuotaWindow>>;
}

export type QuotaSnapshot = ReadonlyMap<string, ProviderQuota>;

export class InvalidSnapshotError extends Error {
	constructor() { super("Invalid quota snapshot"); }
}

function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonnegative(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function normalizePercentage(window: Pick<QuotaWindow, "unlimited" | "remainingPercentage" | "remaining" | "used" | "total">): QuotaPercentage {
	if (window.unlimited === true) return Object.freeze({ kind: "unlimited" });
	const clamp = (value: number) => Math.max(0, Math.min(100, value));
	if (typeof window.remainingPercentage === "number" && Number.isFinite(window.remainingPercentage)) {
		return Object.freeze({ kind: "limited", value: clamp(window.remainingPercentage) });
	}
	if (typeof window.total === "number" && Number.isFinite(window.total) && window.total > 0) {
		if (typeof window.remaining === "number" && Number.isFinite(window.remaining) && window.remaining >= 0) return Object.freeze({ kind: "limited", value: clamp(100 * window.remaining / window.total) });
		if (typeof window.used === "number" && Number.isFinite(window.used) && window.used >= 0) return Object.freeze({ kind: "limited", value: clamp(100 * (1 - window.used / window.total)) });
	}
	return Object.freeze({ kind: "unknown" });
}

function parseWindow(value: unknown): QuotaWindow {
	const source = record(value) ? value : {};
	const window: Omit<QuotaWindow, "percentage"> = {};
	for (const key of ["used", "total", "remaining", "windowSeconds"] as const) {
		const parsed = nonnegative(source[key]);
		if (parsed !== undefined) Object.assign(window, { [key]: parsed });
	}
	if (typeof source.remainingPercentage === "number" && Number.isFinite(source.remainingPercentage)) Object.assign(window, { remainingPercentage: source.remainingPercentage });
	if (typeof source.resetAt === "string" && !Number.isNaN(Date.parse(source.resetAt))) Object.assign(window, { resetAt: source.resetAt });
	if (typeof source.unlimited === "boolean") Object.assign(window, { unlimited: source.unlimited });
	return Object.freeze({ ...window, percentage: normalizePercentage(window) });
}

/** Produce a private, read-only copy; Map.prototype.set cannot mutate the exposed snapshot. */
export function parseSnapshot(value: unknown): QuotaSnapshot {
	if (!record(value) || !Array.isArray(value.providers)) throw new InvalidSnapshotError();
	const entries: Array<[string, ProviderQuota]> = [];
	const seen = new Set<string>();
	for (const item of value.providers) {
		if (!record(item) || typeof item.connectionId !== "string" || !item.connectionId.trim() ||
			typeof item.provider !== "string" || !item.provider.trim() || seen.has(item.connectionId)) throw new InvalidSnapshotError();
		seen.add(item.connectionId);
		const quotas: Record<string, QuotaWindow> = Object.create(null);
		if (record(item.quotas)) for (const [key, window] of Object.entries(item.quotas)) quotas[key] = parseWindow(window);
		const provider: ProviderQuota = Object.freeze({ connectionId: item.connectionId, provider: item.provider,
			...(typeof item.plan === "string" ? { plan: item.plan } : {}), quotas: Object.freeze(quotas) });
		entries.push([item.connectionId, provider]);
	}
	const map = new Map(entries);
	const snapshot: QuotaSnapshot = Object.freeze({
		get: (key: string) => map.get(key),
		has: (key: string) => map.has(key),
		get size() { return map.size; },
		entries: () => map.entries(), keys: () => map.keys(), values: () => map.values(),
		forEach: (fn: (value: ProviderQuota, key: string, snapshot: QuotaSnapshot) => void) => {
			for (const [key, value] of map) fn(value, key, snapshot);
		},
		[Symbol.iterator]: () => map[Symbol.iterator](),
	} satisfies QuotaSnapshot);
	return snapshot;
}
