import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const script = readFileSync(new URL("../de.lars-brandt.omniroute.sdPlugin/ui/provider-selector.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../de.lars-brandt.omniroute.sdPlugin/ui/quota.html", import.meta.url), "utf8");

function inspector(saved: Record<string, unknown> = {}, sendImpl?: (payload: any) => Promise<void>) {
	const handlers: Record<string, (event: any) => void> = {};
	const select = {
		children: [] as any[], value: "", disabled: false,
		replaceChildren(...items: any[]) { this.children = items; }, append(item: any) { this.children.push(item); },
		addEventListener(event: string, callback: (event: any) => void) { handlers[`select:${event}`] = callback; },
	};
	const reload = { addEventListener(event: string, callback: (event: any) => void) { handlers[`reload:${event}`] = callback; } };
	const presentation = { ...select, children: [] as any[], value: "", shadowRoot: undefined as any,
		addEventListener(event: string, callback: (event: any) => void) { handlers[`presentation:${event}`] = callback; } };
	const name = { value: "", addEventListener(event: string, callback: (event: any) => void) { handlers[`name:${event}`] = callback; } };
	const status = { textContent: "" };
	const messages: any[] = [];
	const listeners: Record<string, (message: any) => void> = {};
	const client = {
		getSettings: async () => ({ settings: saved }),
		send: async (_event: string, payload: any) => { messages.push(payload); await sendImpl?.(payload); },
		sendToPropertyInspector: { subscribe: (fn: any) => { listeners.reply = fn; } },
		didReceiveGlobalSettings: { subscribe: (fn: any) => { listeners.global = fn; } },
		didReceiveSettings: { subscribe: (fn: any) => { listeners.settings = fn; } },
	};
	const document = {
		querySelector: (selector: string) => selector === "#provider-connection" ? select : selector === "#provider-status" ? status : selector === "#quota-presentation" ? presentation : selector === "#quota-display-name" ? name : reload,
		createElement: (_tag: string) => ({ value: "", textContent: "", disabled: false }),
	};
	vm.runInNewContext(script, { document, SDPIComponents: { streamDeckClient: client }, Date });
	return { select, presentation, name, status, messages, listeners, handlers };
}

async function flush() { await new Promise(resolve => setTimeout(resolve, 0)); }

test("DOM uses official selector/button, safe text labels and preserves modal controls", async () => {
	assert.match(html, /<sdpi-select id="provider-connection"/);
	assert.match(html, /<sdpi-button id="reload-providers"/);
	for (const control of ["openConnectionSettings()", "cancelConnectionSettings()", "saveConnectionSettings()", "connection-dialog"]) assert.ok(html.includes(control));
	const view = inspector();
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: {} } });
	assert.equal(view.messages.find(message => message.event === "loadProviderConnections")?.event, "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: view.messages.find(message => message.event === "loadProviderConnections").requestId,
		status: "ready", connections: [{ connectionId: "id-1", provider: "codex", name: "<script>unsafe</script>" },
			{ connectionId: "id-2", provider: "codex", name: "<script>unsafe</script>" }] } });
	assert.deepEqual(view.select.children.map(option => option.value), ["", "id-1", "id-2"]);
	assert.equal(view.select.children[1].textContent, "<script>unsafe</script> — codex (id-1)");
	assert.equal(view.select.disabled, false);
	view.select.value = "id-2";
	await view.handlers["select:change"]({});
	assert.equal(view.messages.at(-1).event, "selectProviderConnection");
	assert.equal(view.messages.at(-1).connectionId, "id-2");
	view.handlers["reload:click"]({});
	await flush();
	assert.equal(view.messages.at(-1).event, "loadProviderConnections");
});

test("saved missing ID, loading, empty, authentication and old replies preserve selection", async () => {
	const view = inspector({ connectionId: "missing" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "missing" } } });
	const firstId = view.messages.find(message => message.event === "loadProviderConnections").requestId;
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: firstId, status: "empty", connections: [] } });
	assert.equal(view.select.value, "missing");
	assert.match(view.status.textContent, /unavailable/i);
	view.handlers["reload:click"]({});
	await flush();
	assert.equal(view.select.value, "missing");
	assert.equal(view.select.disabled, true);
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: firstId, status: "ready", connections: [{ connectionId: "other", provider: "codex" }] } });
	assert.equal(view.select.disabled, true);
	view.listeners.reply({ context: "key-b", payload: { event: "providerConnectionsLoaded", requestId: view.messages.at(-1).requestId, status: "ready", connections: [] } });
	assert.equal(view.select.disabled, true);
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: view.messages.at(-1).requestId, status: "authentication", connections: [] } });
	assert.equal(view.select.value, "missing");
	assert.match(view.status.textContent, /Authentication failed/);
	view.select.value = "";
	await view.handlers["select:change"]({});
	assert.equal(view.messages.at(-1).connectionId, "");
});

test("global settings and invalidation refresh open inspector without applying old replies", async () => {
	const view = inspector({ connectionId: "saved" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "saved" } } });
	const first = view.messages.at(-1).requestId;
	view.listeners.global({ payload: { settings: { url: "https://example.test", apiKey: "not-rendered" } } });
	view.listeners.global({ payload: { settings: { url: "https://another.test", apiKey: "not-rendered" } } });
	const second = view.messages.at(-1).requestId;
	assert.notEqual(first, second);
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: first, status: "ready", connections: [{ connectionId: "wrong", provider: "codex" }] } });
	assert.equal(view.select.value, "saved");
	assert.equal(view.select.disabled, true);
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsInvalidated" } });
	const third = view.messages.at(-1).requestId;
	assert.notEqual(second, third);
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: third, status: "ready", connections: [{ connectionId: "saved", provider: "codex" }] } });
	assert.equal(view.select.value, "saved");
	assert.equal(view.select.disabled, false);
	assert.ok(!view.status.textContent.includes("not-rendered"));
});

test("catalog options, unknown saved ID and automatic provider name never auto-save", async () => {
	const view = inspector({ connectionId: "a", presentation: "future" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "future" } } });
	const request = view.messages.find(message => message.event === "loadPresentations").requestId;
	view.listeners.reply({ context: "other", payload: { event: "presentationsLoaded", requestId: request, presentations: [{ id: "wrong", label: "Wrong" }] } });
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: request, presentations: [
		{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" }, { id: "third", label: "Third" },
	] } });
	assert.equal(view.presentation.value, "text");
	assert.deepEqual(view.presentation.children.map(item => item.value), ["text", "double-ring", "third"]);
	const discovery = view.messages.find(message => message.event === "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: discovery.requestId, status: "ready", connections: [
		{ connectionId: "a", provider: "codex", name: "Account" }, { connectionId: "b", provider: "other" },
	] } });
	assert.equal(view.name.value, "codex");
	assert.equal(view.messages.some(message => message.event === "setDisplayName" || message.event === "selectPresentation"), false);
	view.name.value = "<Work>";
	await view.handlers["name:change"]({});
	assert.equal(view.messages.at(-1).displayName, "<Work>");
	view.select.value = "b";
	await view.handlers["select:change"]({});
	assert.equal(view.name.value, "<Work>");
	view.name.value = "  ";
	await view.handlers["name:change"]({});
	assert.equal(view.messages.at(-1).displayName, "");
	assert.equal(view.name.value, "other");
	view.presentation.value = "third";
	await view.handlers["presentation:change"]({});
	assert.equal(view.messages.at(-1).presentation, "third");
});

test("pending edits survive delayed settings and discovery; automatic names follow confirmed connection", async () => {
	const view = inspector({ connectionId: "a" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a" } } });
	assert.equal(view.name.value, "");
	const catalogRequest = view.messages.find(message => message.event === "loadPresentations").requestId;
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: catalogRequest, presentations: [
		{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" },
	] } });
	view.name.value = "Custom";
	await view.handlers["name:change"]({});
	view.presentation.value = "double-ring";
	await view.handlers["presentation:change"]({});
	view.listeners.settings({ context: "key-b", payload: { settings: { connectionId: "b", displayName: "Wrong" } } });
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a" } } });
	assert.equal(view.name.value, "Custom");
	assert.equal(view.presentation.value, "double-ring");
	const id = view.messages.find(message => message.event === "loadProviderConnections").requestId;
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: id, status: "ready", connections: [
		{ connectionId: "a", provider: "Alpha" }, { connectionId: "b", provider: "Beta" },
	] } });
	assert.equal(view.name.value, "Custom");
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "double-ring", displayName: "Custom" } } });
	view.select.value = "b";
	await view.handlers["select:change"]({});
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "b", presentation: "double-ring", displayName: "Custom" } } });
	assert.equal(view.name.value, "Custom");
	view.name.value = " \t ";
	await view.handlers["name:change"]({});
	assert.equal(view.name.value, "Beta");
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "b", presentation: "double-ring" } } });
	assert.equal(view.name.value, "Beta");
	view.select.value = "a";
	await view.handlers["select:change"]({});
	assert.equal(view.name.value, "Alpha");
});

test("reopened inspectors restore their own presentation and reject stale catalog replies", async () => {
	for (const [context, saved, expected] of [
		["key-a", { connectionId: "a", presentation: "double-ring" }, "double-ring"],
		["key-b", { connectionId: "b" }, "text"],
	] as const) {
		const view = inspector(saved);
		await flush();
		view.listeners.settings({ context, payload: { settings: saved } });
		const request = view.messages.find(message => message.event === "loadPresentations").requestId;
		view.listeners.reply({ context, payload: { event: "presentationsLoaded", requestId: "older", presentations: [{ id: "bad", label: "Bad" }] } });
		assert.equal(view.presentation.disabled, true);
		view.listeners.reply({ context, payload: { event: "presentationsLoaded", requestId: request, presentations: [
			{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" },
		] } });
		assert.equal(view.presentation.disabled, false);
		assert.equal(view.presentation.value, expected);
		assert.equal(view.messages.some(message => message.event === "selectPresentation"), false);
	}
});

test("sdpi-select input reads the newly selected native value before the host property updates", async () => {
	const view = inspector({ connectionId: "a", presentation: "double-ring" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "double-ring" } } });
	const request = view.messages.find(message => message.event === "loadPresentations").requestId;
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: request, presentations: [
		{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" },
	] } });
	// The real component emits input from its shadow <select> while the host still has its old value.
	view.presentation.shadowRoot = { querySelector: () => ({ value: "text" }) };
	assert.equal(view.presentation.value, "double-ring");
	view.handlers["presentation:input"]({ target: view.presentation });
	await flush();
	assert.deepEqual(view.messages.filter(message => message.event === "selectPresentation").map(message => message.presentation), ["text"]);
	view.presentation.value = "text";
	view.handlers["presentation:change"]({ target: view.presentation });
	assert.equal(view.messages.filter(message => message.event === "selectPresentation").length, 1);
	view.presentation.shadowRoot = { querySelector: () => ({ value: "double-ring" }) };
	view.handlers["presentation:input"]({ target: view.presentation });
	await flush();
	assert.deepEqual(view.messages.filter(message => message.event === "selectPresentation").map(message => message.presentation), ["text", "double-ring"]);
});

test("failed selection restores confirmed view; stale acknowledgement cannot override a newer edit", async () => {
	let fail = true;
	const view = inspector({ connectionId: "a", presentation: "double-ring" }, async payload => {
		if (payload.event === "selectPresentation" && fail) throw new Error("write failed");
	});
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "double-ring" } } });
	const request = view.messages.find(message => message.event === "loadPresentations").requestId;
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: request, presentations: [
		{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" },
	] } });
	view.presentation.value = "text";
	await view.handlers["presentation:input"]({ target: view.presentation });
	await flush();
	assert.equal(view.presentation.value, "double-ring");
	fail = false;
	view.presentation.value = "text";
	await view.handlers["presentation:input"]({ target: view.presentation });
	const first = view.messages.filter(message => message.event === "selectPresentation")[0];
	const latest = view.messages.filter(message => message.event === "selectPresentation")[1];
	view.listeners.reply({ context: "key-a", payload: { event: "presentationSaved", requestId: first.requestId, presentation: "text", saved: false } });
	view.listeners.reply({ context: "key-a", payload: { event: "presentationSaved", requestId: latest.requestId, presentation: "text", saved: true } });
	assert.equal(view.presentation.value, "text");
});

test("delayed settings and catalog replies do not override the pending selection", async () => {
	const view = inspector({ connectionId: "a", presentation: "double-ring" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "double-ring" } } });
	const catalogRequest = view.messages.find(message => message.event === "loadPresentations").requestId;
	const catalog = [{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" }];
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: catalogRequest, presentations: catalog } });
	view.presentation.value = "text";
	await view.handlers["presentation:input"]({ target: view.presentation });
	const request = view.messages.filter(message => message.event === "selectPresentation").at(-1);
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "double-ring" } } });
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded", requestId: "old", presentations: catalog } });
	assert.equal(view.presentation.value, "text");
	view.listeners.reply({ context: "key-a", payload: { event: "presentationSaved", requestId: request.requestId, presentation: "text", saved: true } });
	assert.equal(view.presentation.value, "text");
	const reopened = inspector({ connectionId: "a", presentation: "text" });
	await flush();
	reopened.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", presentation: "text" } } });
	reopened.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded",
		requestId: reopened.messages.find(message => message.event === "loadPresentations").requestId, presentations: catalog } });
	assert.equal(reopened.presentation.value, "text");
});

test("rapid edits do not let an older acknowledgement undo the latest choice", async () => {
	const view = inspector({ presentation: "double-ring" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { presentation: "double-ring" } } });
	view.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded",
		requestId: view.messages.find(message => message.event === "loadPresentations").requestId,
		presentations: [{ id: "text", label: "Text" }, { id: "double-ring", label: "Double ring" }] } });
	view.presentation.shadowRoot = { querySelector: () => ({ value: "text" }) };
	await view.handlers["presentation:input"]({ target: view.presentation });
	view.presentation.shadowRoot = { querySelector: () => ({ value: "double-ring" }) };
	await view.handlers["presentation:input"]({ target: view.presentation });
	const writes = view.messages.filter(message => message.event === "selectPresentation");
	assert.deepEqual(writes.map(message => message.presentation), ["text", "double-ring"]);
	view.listeners.reply({ context: "key-a", payload: { event: "presentationSaved", requestId: writes[0].requestId, presentation: "text", saved: true } });
	assert.equal(view.presentation.value, "double-ring");
	view.listeners.reply({ context: "key-a", payload: { event: "presentationSaved", requestId: writes[1].requestId, presentation: "double-ring", saved: true } });
	assert.equal(view.presentation.value, "double-ring");
});
