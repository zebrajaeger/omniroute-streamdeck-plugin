import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSnapshot } from "./quota-model";
import { quotaImage, quotaRenderModel, quotaSvg } from "./quota-renderer";
import { presentationOptions, resolvePresentation, presentations } from "./quota-display/catalog";
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
	assert.deepEqual(a.rows, [{ key: "session", label: "S", value: "84%", percentage: { kind: "limited", value: 84 } }, { key: "weekly", label: "W", value: "76%", percentage: { kind: "limited", value: 76 } }]);
	assert.deepEqual(quotaRenderModel(ready, "b").rows, [{ key: "session", label: "S", value: "13%", percentage: { kind: "limited", value: 12.5 } }]);
	assert.equal(quotaRenderModel(ready, "b").plan, "");
	assert.deepEqual(quotaRenderModel(ready, "missing").message, ["Verbindung", "fehlt"]);
	assert.deepEqual(quotaRenderModel(ready, "empty").message, ["Quota ?"]);
});

test("generic windows are codepoint sorted, shortened uniquely, rounded and counted", () => {
	const state: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "generic", quotas: {
		z: {}, abcdef2: { unlimited: true, remainingPercentage: 20 }, abcdef1: { remainingPercentage: 0 },
	} }] }) };
	const model = quotaRenderModel(state, "a");
	assert.deepEqual(model.rows, [{ key: "abcdef1", label: "abc…1", value: "0%", percentage: { kind: "limited", value: 0 } }, { key: "abcdef2", label: "abc…2", value: "∞", percentage: { kind: "unlimited" } }]);
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
	const unsafe = quotaSvg({ ...model, heading: '<&>"\'', plan: "\ud800\u0000", rows: [{ key: "unsafe", label: "</text><script>", value: "100%", percentage: { kind: "limited", value: 100 } }] });
	assert.match(unsafe, /&lt;&amp;&gt;&quot;&apos;/);
	assert.doesNotMatch(unsafe, /<script>|\ud800|\u0000/);
	assert.match(unsafe, /x="68"[^>]+textLength="34"[^>]*>100%/);
});

test("catalog dispatch, fallback and automatic/custom naming", () => {
	for (const id of [undefined, null, 2, {}, "missing"]) assert.equal(resolvePresentation(id).id, "text");
	assert.deepEqual(presentationOptions().map(item => item.id), ["text", "double-ring"]);
	const extra = { id: "extra", label: "Extra", render: () => "extra" };
	assert.equal(resolvePresentation("extra", [...presentations, extra]).render(quotaRenderModel(ready, "a")), "extra");
	assert.equal(presentationOptions([...presentations, extra]).at(-1)?.label, "Extra");
	assert.equal(quotaSvg(quotaRenderModel(ready, "a")), quotaSvg(quotaRenderModel(ready, "a", "  ")));
	const model = quotaRenderModel(ready, "a", "  Work <&>  ");
	assert.equal(model.displayName, "Work <&>");
	assert.equal(model.providerName, "codex");
	assert.match(quotaSvg(model), /Work &lt;&amp;&gt;/);
	assert.equal(quotaRenderModel(ready, "a", "abcdefghijkl🚀xyz").heading, "abcdefghij…");
});

test("double ring uses typed fractions and preserves all special/status states", () => {
	const render = (state: QuotaState, id = "a") => Buffer.from(quotaImage(state, id, "double-ring").split(",")[1]!, "base64").toString();
	const image = render(ready);
	assert.match(image, /width="72" height="72"/);
	assert.match(image, />S \/ W<\/text>/);
	assert.doesNotMatch(image, /84%|76%/);
	assert.match(image, /rotate\(-90 36 36\)/);
	assert.match(image, /stroke="#38bdf8"/);
	assert.match(image, /stroke="#a78bfa"/);
	assert.match(image, /<text[^>]*>codex<\/text>.*<text[^>]*>pro<\/text>/);
	const circles = [...image.matchAll(/<circle[^>]*>/g)].map(match => match[0]);
	assert.match(circles[1]!, /r="32".*stroke="#38bdf8".*stroke-dasharray="[\d.]+ [\d.]+".*rotate\(-90 36 36\)/);
	assert.match(circles[3]!, /r="24".*stroke="#a78bfa".*rotate\(-90 36 36\)/);
	assert.ok(36 - 32 - 2 > 0 && 36 + 32 + 2 < 72);
	const outer = circles[1]!.match(/stroke-dasharray="([\d.]+) ([\d.]+)"/)!;
	const inner = circles[3]!.match(/stroke-dasharray="([\d.]+) ([\d.]+)"/)!;
	assert.ok(Math.abs(Number(outer[1]) / Number(outer[2]) - 0.84) < 1e-12);
	assert.ok(Math.abs(Number(inner[1]) / Number(inner[2]) - 0.76) < 1e-12);
	assert.equal((render(ready, "b").match(/stroke="#475569"/g) ?? []).length, 1);
	assert.match(render(ready, "b"), />S<\/text>/);
	assert.doesNotMatch(render(ready, "b"), />W<\/text>/);
	const fraction: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "<test>", quotas: {
		a: { remainingPercentage: 0 }, b: { remainingPercentage: 12.5 }, c: { remainingPercentage: 100 },
	} }] }) };
	assert.match(render(fraction), />a \/ b<\/text>/);
	assert.doesNotMatch(render(fraction), /0%|13%/);
	assert.match(render(fraction), /<circle cx="36" cy="32" r="29"[^>]*stroke="#475569"/);
	assert.ok(32 + 29 + 2 < 70);
	assert.equal((render(fraction).match(/rotate\(-90 36 32\)/g) ?? []).length, 1);
	const partial = render(fraction).match(/r="21"[^>]*stroke="#a78bfa"[^>]*stroke-dasharray="([\d.]+) ([\d.]+)"/)!;
	assert.ok(Math.abs(Number(partial[1]) / Number(partial[2]) - 0.125) < 1e-12);
	assert.match(render(fraction), /\+1/);
	assert.doesNotMatch(render(fraction), /<test>/);
	const full: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "P", quotas: { session: { remainingPercentage: 100 } } }] }) };
	assert.match(render(full), />S<\/text>/);
	assert.doesNotMatch(render(full), /100%/);
	assert.match(render(full), /stroke="#38bdf8"[^>]*transform="rotate\(-90 36 36\)"/);
	assert.doesNotMatch(render(full), /stroke="#38bdf8"[^>]*stroke-dasharray/);
	const special: QuotaState = { status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "P", quotas: { a: { unlimited: true }, b: {} } }] }) };
	assert.match(render(special), />a ∞ \/ b \?<\/text>/);
	assert.doesNotMatch(render(special), /rotate\(-90/);
	assert.match(render(special), /stroke-dasharray="1 3"/);
	assert.match(render(special), /stroke-dasharray="3 4"/);
	assert.doesNotMatch(render(ready, "empty"), /<circle/);
	for (const status of ["unconfigured", "invalid-configuration", "loading", "authentication", "unavailable", "http", "invalid-response"] as QuotaStatus[]) {
		const output = render({ status, stale: false });
		assert.doesNotMatch(output, /<circle/);
		assert.match(output, /<text/);
	}
	assert.match(render({ status: "unavailable", error: "unavailable", stale: true, snapshot }), /Alt Offline/);
	assert.doesNotMatch(render(ready), /Alt Offline/);
	const unsafe = render({ status: "ready", stale: false, snapshot: parseSnapshot({ providers: [{ connectionId: "a", provider: "<unsafe>", quotas: { "<&": { remainingPercentage: 20 } } }] }) });
	assert.match(unsafe, /&lt;unsafe&gt;/);
	assert.match(unsafe, /&lt;&amp;/);
	assert.doesNotMatch(unsafe, /<unsafe>|<script>/);
});
