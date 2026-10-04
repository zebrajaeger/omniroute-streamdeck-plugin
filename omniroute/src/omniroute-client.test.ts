import assert from "node:assert/strict";
import { test } from "node:test";
import { PassThrough } from "node:stream";
import pino from "pino";
import { loggerOptions } from "./logging";
import { QuotaService } from "./quota-service";
import { OmniRouteClient, QuotaError, snapshotUrl } from "./omniroute-client";

const connection = { url: "https://example.test/base/", apiKey: "secret-key" };

test("instance base path, slash variants, query and bearer header; redirects not followed", async () => {
	for (const base of ["https://example.test/base", "https://example.test/base/"]) {
		assert.equal(snapshotUrl({ ...connection, url: base }).href, "https://example.test/base/api/usage/om-usage?format=json");
	}
	let options: RequestInit | undefined;
	const client = new OmniRouteClient(async (_url, init) => { options = init; return new Response('{"providers":[]}', { status: 200 }); });
	assert.equal((await client.getSnapshot(connection)).size, 0);
	assert.equal(options?.redirect, "manual");
	assert.deepEqual(options?.headers, { Authorization: "Bearer secret-key" });
	await assert.rejects(new OmniRouteClient(async () => new Response(null, { status: 302 })).getSnapshot(connection), (error: QuotaError) => error.kind === "http");
});

test("rejects unsafe or invalid runtime URLs without making requests", async () => {
	let calls = 0;
	const client = new OmniRouteClient(async () => { calls++; return new Response(); });
	for (const url of ["", "ftp://example.test", "https://user:pw@example.test", "https://example.test/?x=1", "https://example.test/#fragment", "https://", "relative"]) {
		await assert.rejects(client.getSnapshot({ url, apiKey: "key" }), (error: QuotaError) => error.kind === "invalid-configuration");
	}
	await assert.rejects(client.getSnapshot({ url: connection.url, apiKey: "" }), (error: QuotaError) => error.kind === "invalid-configuration");
	assert.equal(calls, 0);
});

test("classifies HTTP, network, invalid JSON and structure without exposing response content", async () => {
	for (const [status, kind] of [[401, "authentication"], [403, "authentication"], [500, "http"]] as const) {
		await assert.rejects(new OmniRouteClient(async () => new Response("private body", { status })).getSnapshot(connection),
			(error: QuotaError) => error.kind === kind && error.status === status && !error.message.includes("private"));
	}
	for (const body of ["not json", "{}", '{"providers":[{}]}']) {
		await assert.rejects(new OmniRouteClient(async () => new Response(body)).getSnapshot(connection), (error: QuotaError) => error.kind === "invalid-response");
	}
	await assert.rejects(new OmniRouteClient(async () => { throw new Error("secret-key private body https://example.test"); }).getSnapshot(connection),
		(error: QuotaError) => error.kind === "unavailable" && !error.message.includes("secret-key"));
});

test("times out at 10 seconds and aborts the request", async () => {
	let tick: (() => void) | undefined;
	let cancelled = false;
	const scheduler = { setTimeout: (fn: () => void, ms: number) => { assert.equal(ms, 10_000); tick = fn; return 1 as any; }, clearTimeout: () => { cancelled = true; } };
	const client = new OmniRouteClient(async (_url, init) => new Promise((_resolve, reject) => {
		init?.signal?.addEventListener("abort", () => reject(new Error("private")));
	}), scheduler);
	const pending = client.getSnapshot(connection);
	tick?.();
	await assert.rejects(pending, (error: QuotaError) => error.kind === "unavailable");
	assert.equal(cancelled, true);
});

test("captured diagnostics never contain credentials, URL or response body", async () => {
	const output = new PassThrough();
	let lines = "";
	output.on("data", chunk => { lines += chunk.toString(); });
	const log = pino(loggerOptions, output);
	const client = new OmniRouteClient(async () => new Response("private response body", { status: 503 }));
	const service = new QuotaService(client, globalThis, Date.now, log);
	service.configure(connection);
	await service.refresh();
	service.stop();
	assert.match(lines, /"kind":"http"/);
	assert.match(lines, /"status":503/);
	assert.doesNotMatch(lines, /secret-key|example\.test|private response body|Bearer/);
});
