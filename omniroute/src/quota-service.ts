import type { Logger } from "pino";
import { OmniRouteClient, QuotaError, snapshotUrl, type Connection, type QuotaErrorKind, type Scheduler } from "./omniroute-client";
import type { ProviderQuota, QuotaSnapshot } from "./quota-model";

export type QuotaStatus = "loading" | "ready" | "unconfigured" | "invalid-configuration" | "authentication" | "unavailable" | "http" | "invalid-response";
export interface QuotaState {
	readonly status: QuotaStatus;
	readonly error?: QuotaErrorKind;
	readonly stale: boolean;
	readonly lastSuccessAt?: number;
	readonly snapshot?: QuotaSnapshot;
}
export type QuotaListener = (state: QuotaState) => void;

export class QuotaService {
	private state: QuotaState = Object.freeze({ status: "unconfigured", stale: false });
	private readonly listeners = new Set<QuotaListener>();
	private generation = 0;
	private connection?: Connection;
	private controller?: AbortController;
	private flight?: Promise<void>;
	private timer?: ReturnType<typeof setTimeout>;
	private stopped = false;
	private configured = false;

	constructor(private readonly client: Pick<OmniRouteClient, "getSnapshot"> = new OmniRouteClient(),
		private readonly scheduler: Scheduler = globalThis, private readonly now: () => number = Date.now,
		private readonly log?: Pick<Logger, "warn">) {}

	getState(): QuotaState { return this.state; }
	get(connectionId: string): ProviderQuota | undefined { return this.state.snapshot?.get(connectionId); }
	subscribe(listener: QuotaListener): () => void {
		this.listeners.add(listener);
		try { listener(this.state); } catch { /* Subscriber errors cannot interrupt the service. */ }
		return () => { this.listeners.delete(listener); };
	}

	private publish(next: QuotaState): void {
		if (this.stopped) return;
		this.state = Object.freeze(next);
		for (const listener of this.listeners) {
			try { listener(this.state); } catch { /* Other subscribers must still receive the update. */ }
		}
	}

	configure(settings: { url?: unknown; apiKey?: unknown }): void {
		if (this.stopped) return;
		const url = typeof settings.url === "string" ? settings.url : "";
		const apiKey = typeof settings.apiKey === "string" ? settings.apiKey : "";
		if (this.configured && this.connection?.url === url && this.connection.apiKey === apiKey) return;
		this.configured = true;
		this.generation++;
		this.controller?.abort();
		this.flight = undefined;
		if (this.timer !== undefined) this.scheduler.clearTimeout(this.timer);
		this.timer = undefined;
		this.connection = { url, apiKey };
		if (!url || !apiKey) {
			this.publish({ status: "unconfigured", stale: false });
			return;
		}
		try { snapshotUrl(this.connection); } catch {
			this.publish({ status: "invalid-configuration", error: "invalid-configuration", stale: false });
			return;
		}
		this.publish({ status: "loading", stale: false });
		void this.refresh();
	}

	refresh(): Promise<void> {
		if (this.stopped || !this.connection || !this.connection.url || !this.connection.apiKey) return Promise.resolve();
		try { snapshotUrl(this.connection); } catch { return Promise.resolve(); }
		if (this.flight) return this.flight;
		if (this.timer !== undefined) this.scheduler.clearTimeout(this.timer);
		this.timer = undefined;
		const generation = this.generation;
		const controller = new AbortController();
		this.controller = controller;
		let finish!: () => void;
		const flight = new Promise<void>((resolve) => { finish = resolve; });
		this.flight = flight;
		const connection = this.connection;
		void (async () => {
			try {
				const snapshot = await this.client.getSnapshot(connection, controller.signal);
				if (this.stopped || generation !== this.generation) return;
				this.publish({ status: "ready", snapshot, lastSuccessAt: this.now(), stale: false });
			} catch (error) {
				if (this.stopped || generation !== this.generation) return;
				const kind = error instanceof QuotaError ? error.kind : "unavailable";
				const status = error instanceof QuotaError ? error.status : undefined;
				this.log?.warn({ kind, ...(status === undefined ? {} : { status }) }, "Quota refresh failed");
				this.publish({ status: kind, error: kind, snapshot: this.state.snapshot,
					lastSuccessAt: this.state.lastSuccessAt, stale: this.state.snapshot !== undefined });
			} finally {
				if (!this.stopped && generation === this.generation) {
					this.controller = undefined;
					this.flight = undefined;
					this.timer = this.scheduler.setTimeout(() => { this.timer = undefined; void this.refresh(); }, 20_000);
				}
				finish();
			}
		})();
		return flight;
	}

	stop(): void {
		if (this.stopped) return;
		this.stopped = true;
		this.generation++;
		this.controller?.abort();
		if (this.timer !== undefined) this.scheduler.clearTimeout(this.timer);
		this.timer = undefined;
		this.listeners.clear();
	}
}
