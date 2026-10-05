import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { OmniRouteClient, QuotaError, quotaUrl } from "./omniroute-client";
import { ProviderRegistry, extractProviderConnections } from "./provider-registry";

const connection = { url: "https://example.test/base/", apiKey: "test-secret" };
const fixture = JSON.parse(readFileSync(new URL("./fixtures/quota-discovery.json", import.meta.url), "utf8"));

test("confirmed quota envelope yields only allowed metadata, including two accounts of one provider", () => {
	assert.deepEqual(extractProviderConnections(fixture), [
		{ connectionId: "example-codex-one", provider: "codex", name: "Example account one" },
		{ connectionId: "example-codex-two", provider: "codex", name: "Example account two" },
		{ connectionId: "example-other", provider: "other" },
	]);
	assert.deepEqual(extractProviderConnections({ providers: [] }), []);
});

test("invalid and duplicate identities and collection fail closed", () => {
	for (const body of [{}, { providers: {} }, { providers: [null] }, { providers: [{ provider: "a" }] },
		{ providers: [{ connectionId: " ", provider: "a" }] }, { providers: [{ connectionId: "id", provider: " " }] },
		{ providers: [{ connectionId: "id", provider: "a" }, { connectionId: "id", provider: "b" }] }]) {
		assert.throws(() => extractProviderConnections(body), (error: QuotaError) => error.kind === "invalid-response");
	}
});

test("client uses shared bearer, base URL, timeout and safe error categories", async () => {
	assert.equal(quotaUrl(connection).href, "https://example.test/base/api/usage/quota");
	let calls = 0;
	const client = new OmniRouteClient(async (url, init) => {
		calls++;
		assert.equal(String(url), quotaUrl(connection).href);
		assert.deepEqual(init?.headers, { Authorization: "Bearer test-secret" });
		assert.equal(init?.redirect, "manual");
		return Response.json(fixture);
	});
	assert.equal((await client.getProviderConnections(connection)).length, 3);
	assert.equal(calls, 1);
	for (const [status, kind] of [[401, "authentication"], [403, "authentication"], [503, "http"]] as const) {
		await assert.rejects(new OmniRouteClient(async () => new Response("private", { status })).getProviderConnections(connection),
			(error: QuotaError) => error.kind === kind && !error.message.includes("private"));
	}
	await assert.rejects(new OmniRouteClient(async () => new Response("not json")).getProviderConnections(connection),
		(error: QuotaError) => error.kind === "invalid-response");
	let tick: (() => void) | undefined;
	const scheduler = { setTimeout: (fn: () => void, delay: number) => { assert.equal(delay, 10_000); tick = fn; return 1 as any; }, clearTimeout: () => {} };
	const pending = new OmniRouteClient(async (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Error("private")))), scheduler).getProviderConnections(connection);
	tick?.();
	await assert.rejects(pending, (error: QuotaError) => error.kind === "unavailable" && !error.message.includes("private"));
});

test("registry coalesces requests, invalidates late results and distinguishes empty, auth and config errors", async () => {
	let finish!: (connections: readonly { connectionId: string; provider: string }[]) => void;
	let calls = 0;
	const registry = new ProviderRegistry({ getProviderConnections: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
	registry.configure(connection);
	const first = registry.load();
	const second = registry.load();
	assert.strictEqual(first, second);
	assert.equal(calls, 1);
	registry.configure({ ...connection, apiKey: "new-secret" });
	finish([{ connectionId: "old", provider: "codex" }]);
	assert.equal((await first).status, "unconfigured");
	assert.equal(registry.getState(), undefined);
	const third = registry.load();
	finish([]);
	assert.equal((await third).status, "empty");
	registry.configure({ url: "", apiKey: "" });
	assert.equal((await registry.load()).status, "unconfigured");
	registry.configure({ url: "ftp://example.test", apiKey: "key" });
	assert.equal((await registry.load()).status, "invalid-configuration");
	const denied = new ProviderRegistry({ getProviderConnections: async () => { throw new QuotaError("authentication", 401); } });
	denied.configure(connection);
	assert.deepEqual(await denied.load(), { status: "authentication", connections: [] });
});
