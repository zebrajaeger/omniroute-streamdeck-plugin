import { OmniRouteClient, quotaUrl, type Connection } from "./omniroute-client";
import { QuotaError, type QuotaErrorKind } from "./quota-error";
import type { ProviderConnection } from "./provider-extractor";
export { extractProviderConnections, type ProviderConnection } from "./provider-extractor";
export type DiscoveryState = Readonly<{ status: "ready" | "empty" | "unconfigured" | QuotaErrorKind; connections: readonly ProviderConnection[] }>;

export class ProviderRegistry {
	private connection?: Connection;
	private generation = 0;
	private flight?: Promise<DiscoveryState>;
	private controller?: AbortController;
	private state?: DiscoveryState;

	constructor(private readonly client: Pick<OmniRouteClient, "getProviderConnections"> = new OmniRouteClient()) {}

	configure(settings: { url?: unknown; apiKey?: unknown }): void {
		const next = { url: typeof settings.url === "string" ? settings.url : "", apiKey: typeof settings.apiKey === "string" ? settings.apiKey : "" };
		if (this.connection?.url === next.url && this.connection.apiKey === next.apiKey) return;
		this.generation++;
		this.controller?.abort();
		this.controller = undefined;
		this.flight = undefined;
		this.state = undefined;
		this.connection = next;
	}

	getGeneration(): number { return this.generation; }
	getState(): DiscoveryState | undefined { return this.state; }

	load(): Promise<DiscoveryState> {
		if (this.flight) return this.flight;
		const connection = this.connection;
		if (!connection?.url || !connection.apiKey) return Promise.resolve({ status: "unconfigured", connections: [] });
		try { quotaUrl(connection); } catch { return Promise.resolve({ status: "invalid-configuration", connections: [] }); }
		const generation = this.generation;
		const controller = new AbortController();
		this.controller = controller;
		const flight = (async (): Promise<DiscoveryState> => {
			try {
				const connections = await this.client.getProviderConnections(connection, controller.signal);
				const result: DiscoveryState = { status: connections.length ? "ready" : "empty", connections };
				if (generation === this.generation) this.state = result;
				return generation === this.generation ? result : { status: "unconfigured", connections: [] };
			} catch (error) {
				if (generation !== this.generation) return { status: "unconfigured", connections: [] };
				const status = error instanceof QuotaError ? error.kind : "unavailable";
				return this.state = { status, connections: [] };
			} finally {
				if (generation === this.generation) { this.flight = undefined; this.controller = undefined; }
			}
		})();
		this.flight = flight;
		return flight;
	}
}
