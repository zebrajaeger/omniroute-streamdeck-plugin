import { parseSnapshot, InvalidSnapshotError, type QuotaSnapshot } from "./quota-model";
import { extractProviderConnections, type ProviderConnection } from "./provider-extractor";
import { QuotaError, type QuotaErrorKind } from "./quota-error";

export { QuotaError, type QuotaErrorKind } from "./quota-error";

export type Connection = Readonly<{ url: string; apiKey: string }>;
export type Scheduler = {
	setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
	clearTimeout(handle: ReturnType<typeof setTimeout>): void;
};

export function snapshotUrl(connection: Connection): URL {
	const url = baseUrl(connection);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/usage/om-usage`;
	url.searchParams.set("format", "json");
	return url;
}

function baseUrl(connection: Connection): URL {
	if (typeof connection.url !== "string" || typeof connection.apiKey !== "string" || !connection.apiKey.trim()) throw new QuotaError("invalid-configuration");
	let url: URL;
	try { url = new URL(connection.url); } catch { throw new QuotaError("invalid-configuration"); }
	if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password || url.search || url.hash) throw new QuotaError("invalid-configuration");
	return url;
}

export function quotaUrl(connection: Connection): URL {
	const url = baseUrl(connection);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/usage/quota`;
	return url;
}

export class OmniRouteClient {
	constructor(private readonly fetcher: typeof fetch = fetch, private readonly scheduler: Scheduler = globalThis) {}

	async getProviderConnections(connection: Connection, signal?: AbortSignal): Promise<readonly ProviderConnection[]> {
		const url = quotaUrl(connection);
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
			return extractProviderConnections(body);
		} catch (error) {
			if (error instanceof QuotaError) throw error;
			if (timedOut || controller.signal.aborted || error instanceof Error) throw new QuotaError("unavailable");
			throw new QuotaError("unavailable");
		} finally {
			this.scheduler.clearTimeout(timeout);
			signal?.removeEventListener("abort", abort);
		}
	}

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
