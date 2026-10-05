import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSnapshot } from "./quota-model";
import { quotaImage, quotaRenderModel, quotaSvg } from "./quota-renderer";
import type { QuotaState, QuotaStatus } from "./quota-service";

const snapshot = parseSnapshot({ providers: [
	{ connectionId: "a", provider: "codex", plan: "pro", quotas: { weekly: { remainingPercentage: 76 }, session: { remainingPercentage: 84 } } },
	{ connectionId: "b", provider: "codex", quotas: { session: { remainingPercentage: 12.5 } } },
	{ connectionId: "empty", provider: "other", quotas: {} },
] });
const ready: QuotaState = { status: "ready", stale: false, snapshot };

test("assigned accounts never mix values; provider and optional plan form the heading", () => {
	const a = quotaRenderModel(ready, "a");
	assert.equal(a.heading, "codex");
	assert.equal(a.plan, "pro");
	assert.deepEqual(a.rows, [{ label: "S", value: "84%" }, { label: "W", value: "76%" }]);
	assert.deepEqual(quotaRenderModel(ready, "b").rows, [{ label: "S", value: "13%" }]);
	assert.equal(quotaRenderModel(ready, "b").plan, "");
	assert.deepEqual(quotaRenderModel(ready, "missing").message, ["Verbindung", "fehlt"]);
	assert.deepEqual(quotaRenderModel(ready, "empty").message, ["Quota ?"]);
});

test("generic windows are codepoint sorted, shortened uniquely, rounded and counted", () => {
	const state: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "generic", quotas: {
		z: {}, abcdef2: { unlimited: true, remainingPercentage: 20 }, abcdef1: { remainingPercentage: 0 },
	} }] }) };
	const model = quotaRenderModel(state, "a");
	assert.deepEqual(model.rows, [{ label: "abc…1", value: "0%" }, { label: "abc…2", value: "∞" }]);
	assert.equal(model.footer, "+1");
	const unicode: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "generic", quotas: {
		"𐀀": {}, "\ue000": {}, a: {},
	} }] }) };
	assert.deepEqual(quotaRenderModel(unicode, "a").rows.map(row => row.label), ["a", "\ue000"]);
	assert.equal(quotaRenderModel(unicode, "a").rows[0]!.value, "?");
});

test("configuration and error priorities do not invent quotas or token diagnoses", () => {
	const cases: [QuotaStatus, string[]][] = [
		["unconfigured", ["Verbindung"]], ["invalid-configuration", ["URL ungültig"]], ["loading", ["Laden"]],
		["authentication", ["API-Key"]], ["unavailable", ["Offline"]], ["http", ["HTTP"]], ["invalid-response", ["Datenfehler"]],
	];
	for (const [status, message] of cases) {
		const state: QuotaState = { status, stale: false };
		assert.deepEqual(quotaRenderModel(state, "a").message, message);
		assert.deepEqual(quotaRenderModel(state, "").message, ["Auswählen"]);
		assert.deepEqual(quotaRenderModel(state, undefined).rows, []);
	}
	for (const [status] of cases.filter(([status]) => ["authentication", "unavailable", "http", "invalid-response"].includes(status))) {
		const state: QuotaState = { status, stale: true, snapshot };
		assert.deepEqual(quotaRenderModel(state, "a").rows, quotaRenderModel(ready, "a").rows);
		assert.match(quotaRenderModel(state, "a").footer, /^Alt /);
		assert.deepEqual(quotaRenderModel(state, "missing").rows, []);
		assert.notDeepEqual(quotaRenderModel(state, "missing").message, ["Verbindung", "fehlt"]);
	}
	assert.equal(quotaRenderModel(ready, "a").footer, "");
	assert.deepEqual(quotaRenderModel({ status: "loading", stale: false }, "a").rows, []);
});

test("72x72 SVG reserves values, escapes XML and produces an exact data URL", () => {
	const model = quotaRenderModel(ready, "a");
	const svg = quotaSvg(model);
	assert.equal(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="6" fill="#111827"/><g fill="#f9fafb" font-family="Arial, sans-serif"><text x="36" y="13" font-size="10" text-anchor="middle" textLength="32.5" lengthAdjust="spacingAndGlyphs">codex</text><text x="36" y="24" font-size="8" text-anchor="middle" textLength="15.600000000000001" lengthAdjust="spacingAndGlyphs">pro</text><text x="4" y="39" font-size="9" text-anchor="start" textLength="5.8500000000000005" lengthAdjust="spacingAndGlyphs">S</text><text x="68" y="39" font-size="14" text-anchor="end" textLength="27.3" lengthAdjust="spacingAndGlyphs">84%</text><text x="4" y="56" font-size="9" text-anchor="start" textLength="5.8500000000000005" lengthAdjust="spacingAndGlyphs">W</text><text x="68" y="56" font-size="14" text-anchor="end" textLength="27.3" lengthAdjust="spacingAndGlyphs">76%</text><g fill="#cbd5e1"></g></g></svg>');
	assert.equal(Buffer.from(quotaImage(ready, "a").split(",")[1]!, "base64").toString(), svg);
	const unsafe = quotaSvg({ ...model, heading: '<&>"\'', plan: "\ud800\u0000", rows: [{ label: "</text><script>", value: "100%" }] });
	assert.match(unsafe, /&lt;&amp;&gt;&quot;&apos;/);
	assert.doesNotMatch(unsafe, /<script>|\ud800|\u0000/);
	assert.match(unsafe, /x="68"[^>]+textLength="34"[^>]*>100%/);
});
