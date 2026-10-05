import type { JsonObject } from "@elgato/utils";
import type { ProviderConnection } from "./provider-registry";

export function mergeConnectionId(settings: JsonObject, connectionId: string): JsonObject {
	const next = { ...settings };
	if (connectionId) next.connectionId = connectionId;
	else delete next.connectionId;
	return next;
}

export function providerLabel(item: ProviderConnection): string {
	return `${item.name ? `${item.name} — ` : ""}${item.provider} (${item.connectionId})`;
}
