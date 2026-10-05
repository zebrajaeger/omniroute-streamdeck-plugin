import { QuotaError } from "./quota-error";

export type ProviderConnection = Readonly<{ connectionId: string; provider: string; name?: string }>;

/** Only the confirmed providers collection and public option metadata cross this boundary. */
export function extractProviderConnections(body: unknown): readonly ProviderConnection[] {
	if (!body || typeof body !== "object" || !Array.isArray((body as { providers?: unknown }).providers)) throw new QuotaError("invalid-response");
	const seen = new Set<string>();
	return (body as { providers: unknown[] }).providers.map(value => {
		if (!value || typeof value !== "object") throw new QuotaError("invalid-response");
		const item = value as Record<string, unknown>;
		if (typeof item.connectionId !== "string" || !item.connectionId.trim() || seen.has(item.connectionId) ||
			typeof item.provider !== "string" || !item.provider.trim()) throw new QuotaError("invalid-response");
		seen.add(item.connectionId);
		return Object.freeze({ connectionId: item.connectionId, provider: item.provider,
			...(typeof item.name === "string" && item.name.trim() ? { name: item.name.trim() } : {}) });
	});
}
