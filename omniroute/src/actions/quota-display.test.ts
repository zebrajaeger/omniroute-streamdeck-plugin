import assert from "node:assert/strict";
import { test } from "node:test";
import { QuotaAction } from "./quota";
import { parseSnapshot } from "../quota-model";
import { QuotaService, type QuotaState, type QuotaListener } from "../quota-service";
import { QuotaError } from "../omniroute-client";
import { quotaImage } from "../quota-renderer";

const snapshot = (a: number, b = 23) => parseSnapshot({ providers: [
	{ connectionId: "a", provider: "codex", quotas: { session: { remainingPercentage: a } } },
	{ connectionId: "b", provider: "codex", quotas: { session: { remainingPercentage: b } } },
] });
const ready = (value: number): QuotaState => ({ status: "ready", stale: false, snapshot: snapshot(value) });
function source(initial = ready(84)) {
	let state = initial;
	const listeners: QuotaListener[] = [];
	return { getState: () => state, subscribe(fn: QuotaListener) { listeners.push(fn); fn(state); return () => {}; },
		publish(next: QuotaState) { state = next; for (const listener of listeners) listener(state); }, listeners };
}
function key(id: string) {
	const images: string[] = [];
	const titles: string[] = [];
	return { id, isKey: () => true, images, titles,
		setImage: async (image: string) => { images.push(image); }, setTitle: async (title: string) => { titles.push(title); } };
}
const appear = (action: QuotaAction, k: ReturnType<typeof key>, connectionId: string) => action.onWillAppear({ action: k, payload: { settings: { connectionId } } } as any);
const settings = (action: QuotaAction, k: ReturnType<typeof key>, connectionId: string) => action.onDidReceiveSettings({ action: k, payload: { settings: { connectionId } } } as any);
const disappear = (action: QuotaAction, k: ReturnType<typeof key>) => action.onWillDisappear({ action: k } as any);
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };
function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>(yes => { resolve = yes; });
	return { promise, resolve };
}

test("one subscription, independent initial values, settings, hidden and reappearing keys", async () => {
	const service = source();
	const action = new QuotaAction(undefined, service);
	const a = key("key-a"), b = key("key-b");
	appear(action, a, "a"); appear(action, b, "b");
	await flush();
	assert.equal(service.listeners.length, 1);
	assert.equal(a.images.at(-1), quotaImage(service.getState(), "a"));
	assert.equal(b.images.at(-1), quotaImage(service.getState(), "b"));
	assert.deepEqual(a.titles, [""]);
	settings(action, a, "b"); await flush();
	assert.equal(a.images.at(-1), b.images.at(-1));
	disappear(action, a);
	const count = a.images.length;
	service.publish(ready(50)); await flush();
	assert.equal(a.images.length, count);
	settings(action, a, "a"); await flush();
	assert.equal(a.images.length, count);
	appear(action, a, "a"); await flush();
	assert.equal(a.images.at(-1), quotaImage(service.getState(), "a"));
	service.publish(ready(50)); await flush();
	assert.equal(a.images.length, count + 1);
});

test("slow image writes serialize and coalesce; identical outputs are not resent", async () => {
	const service = source();
	const action = new QuotaAction(undefined, service);
	const a = key("a");
	const wait = deferred();
	const started: string[] = [];
	let calls = 0;
	a.setImage = async image => { started.push(image); if (++calls === 1) await wait.promise; a.images.push(image); };
	appear(action, a, "a"); await flush();
	service.publish(ready(40)); service.publish(ready(60)); await flush();
	assert.equal(started.length, 1);
	wait.resolve(); await flush();
	assert.equal(started.length, 2);
	assert.equal(a.images.at(-1), quotaImage(ready(60), "a"));
	service.publish(ready(60)); await flush();
	assert.equal(started.length, 2);
});

test("pending title skips obsolete image and disappears never initiate more writes", async () => {
	const service = source();
	const action = new QuotaAction(undefined, service);
	const a = key("a");
	const wait = deferred();
	let titles = 0;
	a.setTitle = async () => { if (++titles === 1) await wait.promise; };
	appear(action, a, "a"); await flush();
	settings(action, a, "b");
	wait.resolve(); await flush();
	assert.deepEqual(a.images, [quotaImage(service.getState(), "b")]);
	const slow = deferred();
	a.setTitle = () => slow.promise;
	service.publish(ready(40)); settings(action, a, "a"); await flush();
	disappear(action, a); slow.resolve(); await flush();
	assert.equal(a.images.length, 1);
});

test("same context reappears behind in-flight writes; SDK failures isolate other keys", async () => {
	const service = source();
	const action = new QuotaAction(undefined, service);
	const old = key("same"), fresh = key("same");
	const wait = deferred();
	old.setImage = async image => { await wait.promise; old.images.push(image); };
	appear(action, old, "a"); await flush();
	disappear(action, old); appear(action, fresh, "b"); await flush();
	assert.equal(fresh.images.length, 0);
	wait.resolve(); await flush();
	assert.equal(fresh.images.at(-1), quotaImage(service.getState(), "b"));
	const bad = key("bad"), good = key("good");
	bad.setImage = async () => { throw new Error("secret credentials"); };
	appear(action, bad, "a"); appear(action, good, "a"); await flush();
	service.publish(ready(20)); await flush();
	assert.equal(good.images.at(-1), quotaImage(service.getState(), "a"));
});

test("shared service stale, recovery and instance switch clear old values without key requests", async () => {
	let calls = 0;
	let result: ReturnType<typeof snapshot> | Error = snapshot(84);
	let finish!: (value: ReturnType<typeof snapshot>) => void;
	let pending = false;
	const timers = new Map<number, () => void>();
	let timer = 0;
	const service = new QuotaService({ getSnapshot: async () => {
		calls++;
		if (pending) return new Promise(resolve => { finish = resolve; });
		if (result instanceof Error) throw result;
		return result;
	} }, { setTimeout: (fn: () => void) => { timers.set(++timer, fn); return timer as any; }, clearTimeout: (id: any) => { timers.delete(id); } });
	const action = new QuotaAction(undefined, service);
	const a = key("a"), b = key("b");
	appear(action, a, "a"); appear(action, b, "b");
	service.configure({ url: "https://example.test", apiKey: "secret-key" });
	await service.refresh(); await flush();
	assert.equal(calls, 1);
	result = new QuotaError("unavailable");
	await service.refresh(); await flush();
	assert.match(Buffer.from(a.images.at(-1)!.split(",")[1]!, "base64").toString(), /84%.*Alt Offline/);
	result = snapshot(60);
	await service.refresh(); await flush();
	assert.equal(a.images.at(-1), quotaImage(ready(60), "a"));
	pending = true;
	service.configure({ url: "https://other.test", apiKey: "new-secret" }); await flush();
	assert.equal(service.getState().snapshot, undefined);
	const loading = Buffer.from(a.images.at(-1)!.split(",")[1]!, "base64").toString();
	assert.match(loading, /Laden/); assert.doesNotMatch(loading, /60%|secret|example/);
	finish(snapshot(10)); await service.refresh(); await flush();
	assert.equal(calls, 4);
	assert.equal(timers.size, 1);
	assert.equal(b.images.at(-1), quotaImage(service.getState(), "b"));
	service.stop();
});

test("presentation and name update independently from shared state during slow writes", async () => {
	const service = source();
	const action = new QuotaAction(undefined, service);
	const a = key("a"), b = key("b");
	const wait = deferred();
	a.setTitle = () => wait.promise;
	appear(action, a, "a"); appear(action, b, "b");
	action.onDidReceiveSettings({ action: a, payload: { settings: { connectionId: "a", presentation: "double-ring" } } } as any);
	action.onDidReceiveSettings({ action: a, payload: { settings: { connectionId: "a", presentation: "double-ring", displayName: "Work" } } } as any);
	wait.resolve(); await flush();
	assert.deepEqual(a.images, [quotaImage(service.getState(), "a", "double-ring", "Work")]);
	assert.match(Buffer.from(a.images[0]!.split(",")[1]!, "base64").toString(), />Work<\/text>/);
	assert.doesNotMatch(Buffer.from(a.images[0]!.split(",")[1]!, "base64").toString(), />S<\/text>/);
	assert.doesNotMatch(Buffer.from(a.images[0]!.split(",")[1]!, "base64").toString(), /84%/);
	assert.equal(b.images.at(-1), quotaImage(service.getState(), "b"));
	assert.match(Buffer.from(b.images.at(-1)!.split(",")[1]!, "base64").toString(), /23%/);
	assert.equal(service.listeners.length, 1);
	disappear(action, a);
	appear(action, a, "a");
	await flush();
	assert.equal(a.images.at(-1), quotaImage(service.getState(), "a"));
});

test("double rings keep stale error and overflow then clear cached data on recovery and instance change", async () => {
	const quotas = (session: number) => parseSnapshot({ providers: [{ connectionId: "a", provider: "codex", plan: "pro", quotas: {
		session: { remainingPercentage: session }, weekly: { remainingPercentage: 76 }, z: {},
	} }] });
	const service = source({ status: "ready", stale: false, snapshot: quotas(84) });
	const action = new QuotaAction(undefined, service);
	const a = key("ring");
	const svg = () => Buffer.from(a.images.at(-1)!.split(",")[1]!, "base64").toString();
	action.onWillAppear({ action: a, payload: { settings: { connectionId: "a", presentation: "double-ring", displayName: "Work" } } } as any);
	await flush();
	assert.match(svg(), /Work.*\+1/);
	assert.doesNotMatch(svg(), />pro<\/text>|>S \/ W<\/text>/);
	assert.doesNotMatch(svg(), /84%|76%/);
	const initial = svg();
	service.publish({ status: "unavailable", error: "unavailable", stale: true, snapshot: quotas(84) });
	await flush();
	assert.match(svg(), /Work.*Alt Offline · \+1/);
	assert.doesNotMatch(svg(), />pro<\/text>|>S \/ W<\/text>/);
	assert.doesNotMatch(svg(), /84%|76%/);
	service.publish({ status: "ready", stale: false, snapshot: quotas(32) });
	await flush();
	assert.match(svg(), />Work<\/text>/);
	assert.doesNotMatch(svg(), />pro<\/text>|>S \/ W<\/text>/);
	assert.notEqual(svg(), initial);
	assert.doesNotMatch(svg(), /84%|Alt Offline/);
	service.publish({ status: "loading", stale: false });
	await flush();
	assert.match(svg(), /Laden/);
	assert.doesNotMatch(svg(), /<circle|32%|76%|\+1/);
});
