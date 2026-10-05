import assert from "node:assert/strict";
import { test } from "node:test";
import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./quota";
import { ProviderRegistry } from "../provider-registry";
import { mergeConnectionId, providerLabel } from "../provider-selection";
import { parseSnapshot } from "../quota-model";
import { quotaImage } from "../quota-renderer";

test("action settings merge and clear only the selected ID; labels identify even nameless accounts", () => {
	const first = mergeConnectionId({ existing: true }, "account-1");
	const second = mergeConnectionId({ existing: true }, "account-2");
	assert.deepEqual(first, { existing: true, connectionId: "account-1" });
	assert.deepEqual(second, { existing: true, connectionId: "account-2" });
	assert.deepEqual(mergeConnectionId(first, ""), { existing: true });
	assert.equal(providerLabel({ connectionId: "account-2", provider: "codex" }), "codex (account-2)");
});

test("request IDs and action contexts isolate responses; messages contain only metadata", async () => {
	const originalSend = streamDeck.ui.sendToPropertyInspector;
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	let current: any;
	const sent: any[] = [];
	let finish!: (value: any[]) => void;
	const registry = new ProviderRegistry({ getProviderConnections: () => new Promise(resolve => { finish = resolve; }) });
	const action = new QuotaAction(registry);
	const a = { id: "a", getSettings: async () => ({ other: 1 }), setSettings: async () => {} };
	const b = { id: "b", getSettings: async () => ({ other: 2 }), setSettings: async () => {} };
	try {
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => current });
		streamDeck.ui.sendToPropertyInspector = async payload => { sent.push(payload); };
		registry.configure({ url: "https://example.test", apiKey: "private-key" });
		current = a;
		action.onPropertyInspectorDidAppear({ action: a } as any);
		const old = action.onSendToPlugin({ action: a, payload: { event: "loadProviderConnections", requestId: "old" } } as any);
		const latest = action.onSendToPlugin({ action: a, payload: { event: "loadProviderConnections", requestId: "latest" } } as any);
		finish([{ connectionId: "one", provider: "codex", name: "Example" }]);
		await Promise.all([old, latest]);
		assert.equal(sent.length, 1);
		assert.deepEqual(sent[0], { event: "providerConnectionsLoaded", requestId: "latest", status: "ready",
			connections: [{ connectionId: "one", provider: "codex", name: "Example" }] });
		current = b;
		action.onPropertyInspectorDidDisappear({ action: a } as any);
		action.onPropertyInspectorDidAppear({ action: b } as any);
		await action.onSendToPlugin({ action: a, payload: { event: "loadProviderConnections", requestId: "wrong" } } as any);
		assert.equal(sent.length, 1);
		const pending = action.onSendToPlugin({ action: b, payload: { event: "loadProviderConnections", requestId: "b" } } as any);
		current = a;
		action.onPropertyInspectorDidDisappear({ action: b } as any);
		action.onPropertyInspectorDidAppear({ action: a } as any);
		finish([{ connectionId: "late", provider: "codex" }]);
		await pending;
		assert.equal(sent.length, 1);
	} finally {
		streamDeck.ui.sendToPropertyInspector = originalSend;
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("each action persists only its own explicit selection and preserves other settings", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	let current: any;
	const action = new QuotaAction();
	const createKey = (id: string) => {
		let settings: any = { other: id };
		return { id, getSettings: async () => settings, setSettings: async (next: any) => { settings = next; }, saved: () => settings };
	};
	const a = createKey("a");
	const b = createKey("b");
	try {
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => current });
		for (const [key, id] of [[a, "one"], [b, "two"]] as const) {
			current = key;
			action.onPropertyInspectorDidAppear({ action: key } as any);
			await action.onSendToPlugin({ action: key, payload: { event: "selectProviderConnection", connectionId: id } } as any);
		}
		assert.deepEqual(a.saved(), { other: "a", connectionId: "one" });
		assert.deepEqual(b.saved(), { other: "b", connectionId: "two" });
		await action.onSendToPlugin({ action: b, payload: { event: "selectProviderConnection", connectionId: "" } } as any);
		assert.deepEqual(b.saved(), { other: "b" });
		assert.deepEqual(a.saved(), { other: "a", connectionId: "one" });
	} finally {
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("mixed settings writes serialize, preserve unrelated fields and reject unsupported IDs", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	const originalSend = streamDeck.ui.sendToPropertyInspector;
	let settings: any = { untouched: 9, presentation: "future" };
	const key = { id: "key", getSettings: async () => settings, setSettings: async (next: any) => { await Promise.resolve(); settings = next; } };
	const action = new QuotaAction();
	try {
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => key });
		const sent: any[] = [];
		streamDeck.ui.sendToPropertyInspector = async payload => { sent.push(payload); };
		action.onPropertyInspectorDidAppear({ action: key } as any);
		const send = (payload: any) => action.onSendToPlugin({ action: key, payload } as any);
		await send({ event: "loadPresentations", requestId: "catalog" });
		assert.deepEqual(sent[0], { event: "presentationsLoaded", requestId: "catalog", presentations: [{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" }] });
		await Promise.all([
			send({ event: "selectProviderConnection", connectionId: "one" }),
			send({ event: "selectPresentation", presentation: "double-ring" }),
			send({ event: "setDisplayName", displayName: "  Work  " }),
		]);
		assert.deepEqual(settings, { untouched: 9, connectionId: "one", presentation: "double-ring", displayName: "Work" });
		await send({ event: "selectPresentation", presentation: "future" });
		assert.equal(settings.presentation, "double-ring");
		await send({ event: "selectPresentation", presentation: "text" });
		assert.deepEqual(settings, { untouched: 9, connectionId: "one", presentation: "text", displayName: "Work" });
		await send({ event: "setDisplayName", displayName: "   " });
		assert.deepEqual(settings, { untouched: 9, connectionId: "one", presentation: "text" });
		action.onPropertyInspectorDidDisappear({ action: key } as any);
		await send({ event: "selectPresentation", presentation: "double-ring" });
		assert.equal(settings.presentation, "text");
	} finally {
		streamDeck.ui.sendToPropertyInspector = originalSend;
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("writes queued by a closed inspector visit are discarded without affecting the next visit", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	let current: any;
	let release!: () => void;
	const wait = new Promise<void>(resolve => { release = resolve; });
	let reads = 0;
	let settings: any = { untouched: true };
	const key = { id: "key", getSettings: async () => { reads++; await wait; return settings; }, setSettings: async (next: any) => { settings = next; } };
	const action = new QuotaAction();
	try {
		current = key;
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => current });
		action.onPropertyInspectorDidAppear({ action: key } as any);
		const send = (payload: any, target = key) => action.onSendToPlugin({ action: target, payload } as any);
		const first = send({ event: "selectPresentation", presentation: "double-ring" });
		await Promise.resolve(); await Promise.resolve();
		const queued = send({ event: "setDisplayName", displayName: "Old" });
		const foreign = send({ event: "setDisplayName", displayName: "Wrong" }, { ...key, id: "other" });
		action.onPropertyInspectorDidDisappear({ action: key } as any);
		action.onPropertyInspectorDidAppear({ action: key } as any);
		const next = send({ event: "setDisplayName", displayName: "New" });
		release();
		await Promise.all([first, queued, foreign, next]);
		assert.deepEqual(settings, { untouched: true, displayName: "New" });
		assert.equal(reads, 2);
	} finally {
		release();
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("saving a presentation redraws a visible key even without a settings echo", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	const state = { status: "ready" as const, stale: false, snapshot: parseSnapshot({ providers: [
		{ connectionId: "a", provider: "codex", quotas: { session: { remainingPercentage: 84 } } },
	] }) };
	const images: string[] = [];
	let saved: any = { connectionId: "a" };
	const key = { id: "visible", isKey: () => true,
		getSettings: async () => saved, setSettings: async (next: any) => { saved = next; },
		setTitle: async () => {}, setImage: async (image: string) => { images.push(image); } };
	const action = new QuotaAction(undefined, { getState: () => state, subscribe: () => () => {} });
	try {
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => key });
		action.onWillAppear({ action: key, payload: { settings: saved } } as any);
		action.onPropertyInspectorDidAppear({ action: key } as any);
		await action.onSendToPlugin({ action: key, payload: { event: "selectPresentation", presentation: "double-ring" } } as any);
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(saved.presentation, "double-ring");
		assert.equal(images.at(-1), quotaImage(state, "a", "double-ring"));
	} finally {
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("presentation acknowledgements follow serialized writes and failed writes report failure", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	const originalSend = streamDeck.ui.sendToPropertyInspector;
	let saved: any = { connectionId: "a" };
	let fail = false;
	const replies: any[] = [];
	const key = { id: "a", getSettings: async () => saved, setSettings: async (next: any) => {
		if (fail) throw new Error("write failed");
		saved = next;
	} };
	const action = new QuotaAction();
	try {
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => key });
		streamDeck.ui.sendToPropertyInspector = async payload => { replies.push(payload); };
		action.onPropertyInspectorDidAppear({ action: key } as any);
		const send = (presentation: string, requestId: string) => action.onSendToPlugin({ action: key,
			payload: { event: "selectPresentation", presentation, requestId } } as any);
		await Promise.all([send("double-ring", "first"), send("text", "second")]);
		assert.equal(saved.presentation, "text");
		assert.deepEqual(replies, [
			{ event: "presentationSaved", requestId: "first", presentation: "double-ring", saved: true },
			{ event: "presentationSaved", requestId: "second", presentation: "text", saved: true },
		]);
		fail = true;
		await send("double-ring", "failed");
		assert.equal(saved.presentation, "text");
		assert.deepEqual(replies.at(-1), { event: "presentationSaved", requestId: "failed", presentation: "double-ring", saved: false });
	} finally {
		streamDeck.ui.sendToPropertyInspector = originalSend;
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("changing one visible presentation redraws from shared state without fetching or touching another key", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	const state = { status: "ready" as const, stale: false, snapshot: parseSnapshot({ providers: [
		{ connectionId: "a", provider: "codex", quotas: { session: { remainingPercentage: 84 } } },
		{ connectionId: "b", provider: "codex", quotas: { session: { remainingPercentage: 23 } } },
	] }) };
	let stateReads = 0;
	const service = { getState: () => { stateReads++; return state; }, subscribe: () => () => {} };
	const createKey = (id: string, connectionId: string) => {
		const images: string[] = [];
		let saved: any = { connectionId, displayName: id, untouched: true };
		return { id, isKey: () => true, images, getSettings: async () => saved,
			setSettings: async (next: any) => { saved = next; }, saved: () => saved,
			setTitle: async () => {}, setImage: async (image: string) => { images.push(image); } };
	};
	const a = createKey("first", "a"), b = createKey("second", "b");
	const action = new QuotaAction(undefined, service);
	try {
		let current: any = a;
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => current });
		action.onWillAppear({ action: a, payload: { settings: a.saved() } } as any);
		action.onWillAppear({ action: b, payload: { settings: b.saved() } } as any);
		await new Promise(resolve => setImmediate(resolve));
		const otherImages = b.images.length;
		const initial = a.images.at(-1);
		action.onPropertyInspectorDidAppear({ action: a } as any);
		const send = (presentation: string) => action.onSendToPlugin({ action: a,
			payload: { event: "selectPresentation", presentation } } as any);
		await send("double-ring");
		await new Promise(resolve => setImmediate(resolve));
		assert.deepEqual(a.saved(), { connectionId: "a", displayName: "first", untouched: true, presentation: "double-ring" });
		assert.equal(a.images.at(-1), quotaImage(state, "a", "double-ring", "first"));
		assert.notEqual(a.images.at(-1), initial);
		await send("text");
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(a.images.at(-1), initial);
		assert.equal(b.images.length, otherImages);
		assert.equal(b.saved().presentation, undefined);
		assert.equal(stateReads, 4); // two initial renders, two local presentation changes; no quota fetch API
	} finally {
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});

test("color schemes use serialized per-key settings and redraw only the selected visible key", async () => {
	const originalAction = Object.getOwnPropertyDescriptor(streamDeck.ui, "action");
	const originalSend = streamDeck.ui.sendToPropertyInspector;
	const state = { status: "ready" as const, stale: false, snapshot: parseSnapshot({ providers: [
		{ connectionId: "a", provider: "codex", quotas: { session: { remainingPercentage: 84 }, weekly: { remainingPercentage: 76 } } },
	] }) };
	let reads = 0;
	const service = { getState: () => { reads++; return state; }, subscribe: () => () => {} };
	const makeKey = (id: string, colorScheme?: unknown) => {
		let saved: any = { connectionId: "a", presentation: "double-ring", displayName: id, untouched: true, colorScheme };
		const images: string[] = [];
		return { id, images, isKey: () => true, saved: () => saved, getSettings: async () => saved,
			setSettings: async (next: any) => { saved = next; }, setTitle: async () => {}, setImage: async (image: string) => { images.push(image); } };
	};
	const a = makeKey("a", "unsupported"), b = makeKey("b");
	const action = new QuotaAction(undefined, service);
	try {
		let current: any = a;
		const replies: any[] = [];
		Object.defineProperty(streamDeck.ui, "action", { configurable: true, get: () => current });
		streamDeck.ui.sendToPropertyInspector = async payload => { replies.push(payload); };
		action.onWillAppear({ action: a, payload: { settings: a.saved() } } as any);
		action.onWillAppear({ action: b, payload: { settings: b.saved() } } as any);
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(a.images.at(-1), quotaImage(state, "a", "double-ring", "a"));
		assert.equal(a.saved().colorScheme, "unsupported");
		const bImages = b.images.length;
		action.onPropertyInspectorDidAppear({ action: a } as any);
		const send = (payload: any) => action.onSendToPlugin({ action: a, payload } as any);
		await send({ event: "loadColorSchemes", requestId: "list" });
		assert.deepEqual(replies[0].colorSchemes.map((scheme: any) => scheme.id), [
			"classic", "warm", "vivid", "sunset", "ocean", "forest", "royal", "ember", "orchid", "solar",
		]);
		await send({ event: "selectColorScheme", colorScheme: "unknown", requestId: "bad" });
		assert.equal(a.saved().colorScheme, "unsupported");
		await Promise.all([
			send({ event: "selectColorScheme", colorScheme: "warm", requestId: "first" }),
			send({ event: "selectColorScheme", colorScheme: "vivid", requestId: "second" }),
		]);
		await new Promise(resolve => setImmediate(resolve));
		assert.deepEqual(a.saved(), { connectionId: "a", presentation: "double-ring", displayName: "a", untouched: true, colorScheme: "vivid" });
		assert.equal(a.images.at(-1), quotaImage(state, "a", "double-ring", "a", "vivid"));
		assert.equal(b.images.length, bImages);
		assert.deepEqual(replies.slice(1), [
			{ event: "colorSchemeSaved", requestId: "first", colorScheme: "warm", saved: true },
			{ event: "colorSchemeSaved", requestId: "second", colorScheme: "vivid", saved: true },
		]);
		assert.equal(reads, 4); // Two initial renders and two palette redraws; no quota fetch.
		current = b;
		action.onPropertyInspectorDidAppear({ action: b } as any);
		await action.onSendToPlugin({ action: b, payload: { event: "selectColorScheme", colorScheme: "warm" } } as any);
		assert.equal(a.saved().colorScheme, "vivid");
		assert.equal(b.saved().colorScheme, "warm");
		await action.onSendToPlugin({ action: b, payload: { event: "selectColorScheme", colorScheme: "solar" } } as any);
		assert.equal(b.saved().colorScheme, "solar");
		assert.equal(b.images.at(-1), quotaImage(state, "a", "double-ring", "b", "solar"));
	} finally {
		streamDeck.ui.sendToPropertyInspector = originalSend;
		if (originalAction) Object.defineProperty(streamDeck.ui, "action", originalAction);
		else delete (streamDeck.ui as any).action;
	}
});
