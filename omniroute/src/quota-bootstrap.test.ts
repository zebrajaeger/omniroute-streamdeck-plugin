import assert from "node:assert/strict";
import { test } from "node:test";
import { startQuotaService, type SettingsSDK } from "./quota-bootstrap";

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(yes => { resolve = yes; });
	return { promise, resolve };
}

test("waits for SDK ready, listens before read and ignores stale initial settings", async () => {
	const ready = deferred<void>();
	const read = deferred<any>();
	let listener!: (ev: any) => void;
	let reads = 0;
	let disposed = false;
	const settings: any[] = [];
	const sdk: SettingsSDK = {
		connect: () => ready.promise,
		settings: {
			getGlobalSettings: () => { reads++; return read.promise; },
			onDidReceiveGlobalSettings: callback => { listener = callback; return { dispose: () => { disposed = true; } }; },
		},
	};
	let stopped = false;
	const boot = startQuotaService(sdk, { configure: value => { settings.push(value); }, stop: () => { stopped = true; } });
	assert.equal(reads, 0);
	ready.resolve();
	await ready.promise;
	await Promise.resolve();
	assert.equal(reads, 1);
	// The direct SDPI global-settings writer produces this SDK event.
	listener({ settings: { url: "http://direct", apiKey: "a" } });
	listener({ settings: { url: "http://updated", apiKey: "b" } });
	read.resolve({ url: "http://stale", apiKey: "old" });
	const stop = await boot;
	assert.deepEqual(settings.map(value => value.url), ["http://direct", "http://updated"]);
	stop();
	listener({ settings: { url: "http://late" } });
	assert.equal(settings.length, 2);
	assert.equal(disposed, true);
	assert.equal(stopped, true);
});

test("initial settings are applied when no newer event supersedes them", async () => {
	let initial: unknown;
	const sdk: SettingsSDK = {
		connect: async () => {},
		settings: { getGlobalSettings: async () => ({ url: "http://initial", apiKey: "key" }),
			onDidReceiveGlobalSettings: () => ({ dispose() {} }) },
	};
	const stop = await startQuotaService(sdk, { configure: value => { initial = value; }, stop() {} });
	assert.deepEqual(initial, { url: "http://initial", apiKey: "key" });
	stop();
});
