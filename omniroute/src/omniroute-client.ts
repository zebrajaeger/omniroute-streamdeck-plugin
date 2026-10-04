import { parseSnapshot, InvalidSnapshotError, type QuotaSnapshot } from "./quota-model";

export type QuotaErrorKind = "invalid-configuration" | "authentication" | "unavailable" | "http" | "invalid-response";

export class QuotaError extends Error {
	constructor(readonly kind: QuotaErrorKind, readonly status?: number) { super(kind); }
}

export type Connection = Readonly<{ url: string; apiKey: string }>;
export type Scheduler = {
	setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
	clearTimeout(handle: ReturnType<typeof setTimeout>): void;
};

export function snapshotUrl(connection: Connection): URL {
	if (typeof connection.url !== "string" || typeof connection.apiKey !== "string" || !connection.apiKey.trim()) throw new QuotaError("invalid-configuration");
	let url: URL;
	try { url = new URL(connection.url); } catch { throw new QuotaError("invalid-configuration"); }
	if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password || url.search || url.hash) throw new QuotaError("invalid-configuration");
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/usage/om-usage`;
	url.searchParams.set("format", "json");
	return url;
}

export class OmniRouteClient {
	constructor(private readonly fetcher: typeof fetch = fetch, private readonly scheduler: Scheduler = globalThis) {}

	async getSnapshot(connection: Connection, signal?: AbortSignal): Promise<QuotaSnapshot> {
		const url = snapshotUrl(connection);
		const controller = new AbortController();
		let timedOut = false;
		const timeout = this.scheduler.setTimeout(() => { timedOut = true; controller.abort(); }, 10_000);
		const abort = () => controller.abort();
		signal?.addEventListener("abort", abort, { once: true });
		try {
			if (signal?.aborted) controller.abort();
			const response = await this.fetcher(url, { method: "GET", headers: { Authorization: `Bearer ${connection.apiKey}` }, redirect: "manual", signal: controller.signal });
			if (response.status === 401 || response.status === 403) throw new QuotaError("authentication", response.status);
			if (!response.ok) throw new QuotaError("http", response.status);
			let body: unknown;
			try { body = await response.json(); } catch { throw new QuotaError("invalid-response"); }
			try { return parseSnapshot(body); } catch (error) {
				if (error instanceof InvalidSnapshotError) throw new QuotaError("invalid-response");
				throw error;
			}
		} catch (error) {
			if (error instanceof QuotaError) throw error;
			if (timedOut || controller.signal.aborted || error instanceof Error) throw new QuotaError("unavailable");
			throw new QuotaError("unavailable");
		} finally {
			this.scheduler.clearTimeout(timeout);
			signal?.removeEventListener("abort", abort);
		}
	}
}
