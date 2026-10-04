import assert from "node:assert/strict";
import { test } from "node:test";
import { QuotaError } from "./omniroute-client";
import { parseSnapshot } from "./quota-model";
import { QuotaService } from "./quota-service";

const config = { url: "http://localhost:20128", apiKey: "secret-key" };
const snapshot = (ids: string[]) => parseSnapshot({ providers: ids.map(connectionId => ({ connectionId, provider: "codex" })) });
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
}
function clock() {
	const timers = new Map<number, { fn: () => void; delay: number }>();
	let id = 0;
	return { timers, scheduler: {
		setTimeout(fn: () => void, delay: number) { const key = ++id; timers.set(key, { fn, delay }); return key as any; },
		clearTimeout(key: any) { timers.delete(key); },
	}, fire() { const [key, timer] = [...timers][0]!; timers.delete(key); timer.fn(); } };
}

test("one initial request, one flight for subscribers, repeat 20 seconds after completion", async () => {
	const time = clock();
	const requests: ReturnType<typeof deferred<ReturnType<typeof snapshot>>>[] = [];
	const service = new QuotaService({ getSnapshot: async () => { const pending = deferred<ReturnType<typeof snapshot>>(); requests.push(pending); return pending.promise; } }, time.scheduler);
	service.subscribe(() => {});
	service.subscribe(() => {});
	service.configure(config);
	assert.equal(requests.length, 1);
	assert.equal(service.refresh(), service.refresh());
	assert.equal(requests.length, 1);
	assert.equal(time.timers.size, 0);
	requests[0]!.resolve(snapshot(["one"]));
	await service.refresh();
	assert.deepEqual([...time.timers.values()].map(x => x.delay), [20_000]);
	time.fire();
	assert.equal(requests.length, 2);
	assert.equal(time.timers.size, 0);
	requests[1]!.resolve(snapshot([]));
	await service.refresh();
	assert.equal(service.get("one"), undefined);
	assert.equal(service.getState().snapshot?.size, 0);
	service.stop();
});

test("stale error, safe logger, recovery and isolated subscribers", async () => {
	const time = clock();
	const results = [snapshot(["one"]), new QuotaError("authentication", 401), snapshot(["two"])];
	const logs: unknown[] = [];
	const service = new QuotaService({ getSnapshot: async () => { const result = results.shift()!; if (result instanceof Error) throw result; return result; } }, time.scheduler, () => 123,
		{ warn: (...args: unknown[]) => { logs.push(args); } } as any);
	const observed: string[] = [];
	service.subscribe(() => { throw new Error("subscriber secret"); });
	const unsubscribe = service.subscribe(state => { observed.push(state.status); });
	assert.deepEqual(observed, ["unconfigured"]);
	service.configure(config);
	await service.refresh();
	assert.equal(service.get("one")?.connectionId, "one");
	time.fire();
	await service.refresh();
	assert.equal(service.getState().status, "authentication");
	assert.equal(service.getState().stale, true);
	assert.equal(service.getState().lastSuccessAt, 123);
	assert.equal(service.get("one")?.connectionId, "one");
	assert.doesNotMatch(JSON.stringify(logs), /secret-key|localhost|subscriber secret|private body/);
	time.fire();
	await service.refresh();
	assert.equal(service.getState().status, "ready");
	assert.equal(service.getState().stale, false);
	assert.equal(service.getState().error, undefined);
	assert.equal(service.get("one"), undefined);
	unsubscribe();
	const count = observed.length;
	service.configure({ url: "", apiKey: "" });
	assert.equal(observed.length, count);
	service.stop();
});

test("configuration generations discard late responses, clear cache and stop prevents publishing", async () => {
	const time = clock();
	const pending: ReturnType<typeof deferred<ReturnType<typeof snapshot>>>[] = [];
	const service = new QuotaService({ getSnapshot: async () => { const item = deferred<ReturnType<typeof snapshot>>(); pending.push(item); return item.promise; } }, time.scheduler);
	const states: string[] = [];
	service.subscribe(state => states.push(state.status));
	service.configure(config);
	service.configure(config);
	assert.equal(pending.length, 1);
	service.configure({ ...config, apiKey: "new-key" });
	assert.equal(pending.length, 2);
	assert.equal(service.getState().snapshot, undefined);
	pending[0]!.resolve(snapshot(["old"]));
	await pending[0]!.promise;
	await Promise.resolve();
	assert.equal(service.get("old"), undefined);
	pending[1]!.resolve(snapshot(["new"]));
	await service.refresh();
	assert.equal(service.get("new")?.connectionId, "new");
	service.configure({ ...config, url: "http://other.test" });
	assert.equal(service.get("new"), undefined);
	const count = states.length;
	service.stop();
	pending[2]!.resolve(snapshot(["late"]));
	await pending[2]!.promise;
	await Promise.resolve();
	assert.equal(states.length, count);
	assert.equal(time.timers.size, 0);
});
