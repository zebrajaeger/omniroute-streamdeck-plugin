import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePercentage, parseSnapshot, InvalidSnapshotError } from "./quota-model";

test("preserves two accounts of one provider and arbitrary windows without mutable references", () => {
	const input = { providers: [
		{ connectionId: "a", provider: "codex", plan: "team", quotas: { session: { remaining: 84, total: 100 } } },
		{ connectionId: "b", provider: "codex", quotas: { premium_interactions: { unlimited: true } } },
	] };
	const snapshot = parseSnapshot(input);
	input.providers[0]!.quotas.session!.remaining = 0;
	assert.equal(snapshot.size, 2);
	assert.equal(snapshot.get("a")?.quotas.session.percentage.kind, "limited");
	assert.equal(snapshot.get("b")?.quotas.premium_interactions.percentage.kind, "unlimited");
	assert.equal("set" in snapshot, false);
	assert.equal(parseSnapshot({ providers: [] }).size, 0);
});

test("rejects missing, duplicate or invalid identities and envelope", () => {
	for (const input of [{}, { providers: null }, { providers: [{ provider: "a" }] },
		{ providers: [{ connectionId: "a", provider: "" }] },
		{ providers: [{ connectionId: "a", provider: "x" }, { connectionId: "a", provider: "y" }] }]) {
		assert.throws(() => parseSnapshot(input), InvalidSnapshotError);
	}
});

test("invalid optional fields are unknown, not coerced", () => {
	const window = parseSnapshot({ providers: [{ connectionId: "a", provider: "x", plan: 3,
		quotas: { custom: { used: "1", total: null, remainingPercentage: Infinity, resetAt: "oops", unlimited: "true", windowSeconds: -1 } } }] }).get("a")!;
	assert.equal(window.plan, undefined);
	assert.deepEqual(window.quotas.custom.percentage, { kind: "unknown" });
	assert.equal(window.quotas.custom.used, undefined);
	assert.equal(window.quotas.custom.resetAt, undefined);
});

test("percentage priority, clamping, exhaustion, null, unknown and unlimited", () => {
	const cases: Array<[Record<string, any>, object]> = [
		[{ remainingPercentage: 125, remaining: 2, total: 10 }, { kind: "limited", value: 100 }],
		[{ remainingPercentage: -5 }, { kind: "limited", value: 0 }],
		[{ remaining: 84, total: 100 }, { kind: "limited", value: 84 }],
		[{ used: 24, total: 100 }, { kind: "limited", value: 76 }],
		[{ used: 200, total: 100 }, { kind: "limited", value: 0 }],
		[{ remaining: 0, total: 100 }, { kind: "limited", value: 0 }],
		[{ remaining: 45 }, { kind: "unknown" }],
		[{ remaining: null, total: 100 }, { kind: "unknown" }],
		[{}, { kind: "unknown" }],
		[{ unlimited: true, remainingPercentage: 0 }, { kind: "unlimited" }],
	];
	for (const [input, expected] of cases) assert.deepEqual(normalizePercentage(input), expected);
});
