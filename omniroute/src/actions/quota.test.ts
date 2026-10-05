import assert from "node:assert/strict";
import { test } from "node:test";
import streamDeck from "@elgato/streamdeck";
import { QuotaAction } from "./quota";
import { ProviderRegistry } from "../provider-registry";
import { mergeConnectionId, providerLabel } from "../provider-selection";

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
