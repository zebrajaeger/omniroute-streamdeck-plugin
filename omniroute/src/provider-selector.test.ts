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
	const schemeItem = { hidden: true };
	const scheme = { ...select, children: [] as any[], value: "", shadowRoot: undefined as any,
		addEventListener(event: string, callback: (event: any) => void) { handlers[`scheme:${event}`] = callback; } };
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
		querySelector: (selector: string) => selector === "#provider-connection" ? select : selector === "#provider-status" ? status : selector === "#quota-presentation" ? presentation : selector === "#color-scheme-item" ? schemeItem : selector === "#quota-color-scheme" ? scheme : selector === "#quota-display-name" ? name : reload,
		createElement: (_tag: string) => ({ value: "", textContent: "", disabled: false }),
	};
	vm.runInNewContext(script, { document, SDPIComponents: { streamDeckClient: client }, Date });
	return { select, presentation, schemeItem, scheme, name, status, messages, listeners, handlers };
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

test("sdpi-textfield input fires before host value changes and blur does not emit change", async () => {
	const view = inspector({ connectionId: "a" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a" } } });
	const discovery = view.messages.find(message => message.event === "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: discovery.requestId,
		status: "ready", connections: [{ connectionId: "a", provider: "codex" }] } });
	assert.equal(view.name.value, "codex");
	assert.equal(view.messages.some(message => message.event === "setDisplayName"), false);
	// Observed in the Stream Deck Developer Tools: input's composed path contains the
	// updated inner INPUT, while sdpi-textfield.value is still the old provider name.
	const inner = { tagName: "INPUT", value: "Work" };
	view.handlers["name:input"]({ composedPath: () => [inner, view.name] });
	view.name.value = "Work";
	view.handlers["name:blur"]?.({});
	await flush();
	assert.deepEqual(view.messages.filter(message => message.event === "setDisplayName").map(message => message.displayName), ["Work"]);
});

test("rapid name edits ignore stale settings and failed writes restore saved name", async () => {
	let fail = false;
	const view = inspector({ connectionId: "a", displayName: "Saved" }, async payload => {
		if (payload.event === "setDisplayName" && fail) throw new Error("write failed");
	});
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", displayName: "Saved" } } });
	const discovery = view.messages.find(message => message.event === "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: discovery.requestId,
		status: "ready", connections: [{ connectionId: "a", provider: "codex" }] } });
	const type = (value: string) => { view.handlers["name:input"]({ composedPath: () => [{ tagName: "INPUT", value }] }); view.name.value = value; };
	type("First");
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", displayName: "Saved" } } });
	assert.equal(view.name.value, "First");
	type("Second");
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", displayName: "First" } } });
	assert.equal(view.name.value, "Second");
	const writes = view.messages.filter(message => message.event === "setDisplayName");
	assert.deepEqual(writes.map(message => message.displayName), ["First", "Second"]);
	view.listeners.reply({ context: "key-a", payload: { event: "displayNameSaved", requestId: writes[0].requestId, saved: true } });
	assert.equal(view.name.value, "Second");
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", displayName: "Second" } } });
	view.listeners.reply({ context: "key-a", payload: { event: "displayNameSaved", requestId: writes[1].requestId, saved: true } });
	fail = true;
	type("Unsaved");
	await flush();
	assert.equal(view.name.value, "Saved");
});

test("name acknowledgement releases pending state without settings echo", async () => {
	const view = inspector({ connectionId: "a" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a" } } });
	const discovery = view.messages.find(message => message.event === "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: discovery.requestId,
		status: "ready", connections: [{ connectionId: "a", provider: "codex" }] } });
	view.handlers["name:input"]({ composedPath: () => [{ tagName: "INPUT", value: "Work" }] });
	const write = view.messages.at(-1);
	view.name.value = "Work";
	view.listeners.reply({ context: "key-a", payload: { event: "displayNameSaved", requestId: write.requestId, saved: true } });
	view.select.value = "";
	await view.handlers["select:change"]({});
	assert.equal(view.name.value, "Work");
});

test("literal newline escape remains in the name field after reopening", async () => {
	const view = inspector({ connectionId: "a" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a" } } });
	view.handlers["name:input"]({ composedPath: () => [{ tagName: "INPUT", value: "Work\\nTeam" }] });
	assert.equal(view.messages.at(-1).displayName, "Work\\nTeam");
	const reopened = inspector({ connectionId: "a", displayName: "Work\\nTeam" });
	await flush();
	reopened.listeners.settings({ context: "key-a", payload: { settings: { connectionId: "a", displayName: "Work\\nTeam" } } });
	assert.equal(reopened.name.value, "Work\\nTeam");
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

test("ring schemes appear only in ring view, restore independently and never auto-save unsupported IDs", async () => {
	assert.match(html, /<sdpi-item id="color-scheme-item"[^>]*><sdpi-select id="quota-color-scheme"/);
	const options = [{ id: "classic", label: "Classic" }, { id: "warm", label: "Warm" }, { id: "vivid", label: "Vivid" }];
	for (const [saved, expected] of [[{ presentation: "double-ring", colorScheme: "warm" }, "warm"],
		[{ presentation: "double-ring", colorScheme: "future" }, "classic"], [{ presentation: "double-ring", colorScheme: 23 }, "classic"],
		[{ presentation: "double-ring" }, "classic"]] as const) {
		const view = inspector(saved);
		await flush();
		view.listeners.settings({ context: "key-a", payload: { settings: saved } });
		const schemeRequest = view.messages.find(message => message.event === "loadColorSchemes").requestId;
		view.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded", requestId: "old", colorSchemes: options } });
		assert.equal(view.scheme.disabled, true);
		view.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded", requestId: schemeRequest, colorSchemes: options } });
		assert.equal(view.schemeItem.hidden, false);
		assert.equal(view.scheme.value, expected);
		assert.equal(view.scheme.disabled, false);
		assert.equal(view.messages.some(message => message.event === "selectColorScheme"), false);
	}
	const text = inspector({ presentation: "text", colorScheme: "vivid" });
	await flush();
	text.listeners.settings({ context: "key-a", payload: { settings: { presentation: "text", colorScheme: "vivid" } } });
	text.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded",
		requestId: text.messages.find(message => message.event === "loadColorSchemes").requestId, colorSchemes: options } });
	assert.equal(text.schemeItem.hidden, true);
	assert.equal(text.scheme.disabled, true);
	assert.equal(text.scheme.value, "vivid");
	text.listeners.reply({ context: "key-a", payload: { event: "presentationsLoaded",
		requestId: text.messages.find(message => message.event === "loadPresentations").requestId,
		presentations: [{ id: "text", label: "Text" }, { id: "double-ring", label: "Ring" }] } });
	text.presentation.value = "double-ring";
	await text.handlers["presentation:change"]({ target: text.presentation });
	assert.equal(text.schemeItem.hidden, false);
	assert.equal(text.scheme.value, "vivid");
});

test("ring scheme selection reads native value, survives stale replies and rolls back failed writes", async () => {
	const view = inspector({ presentation: "double-ring", colorScheme: "classic" });
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: { presentation: "double-ring", colorScheme: "classic" } } });
	view.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded",
		requestId: view.messages.find(message => message.event === "loadColorSchemes").requestId,
		colorSchemes: [{ id: "classic", label: "Classic" }, { id: "warm", label: "Warm" }, { id: "vivid", label: "Vivid" }] } });
	view.scheme.shadowRoot = { querySelector: () => ({ value: "warm" }) };
	await view.handlers["scheme:input"]({ target: view.scheme });
	view.scheme.value = "warm";
	view.handlers["scheme:change"]({ target: view.scheme });
	assert.deepEqual(view.messages.filter(message => message.event === "selectColorScheme").map(message => message.colorScheme), ["warm"]);
	view.listeners.settings({ context: "key-a", payload: { settings: { presentation: "double-ring", colorScheme: "classic" } } });
	assert.equal(view.scheme.value, "warm");
	view.scheme.shadowRoot = { querySelector: () => ({ value: "vivid" }) };
	await view.handlers["scheme:input"]({ target: view.scheme });
	const writes = view.messages.filter(message => message.event === "selectColorScheme");
	view.listeners.reply({ context: "key-a", payload: { event: "colorSchemeSaved", requestId: writes[0].requestId, colorScheme: "warm", saved: true } });
	assert.equal(view.scheme.value, "vivid");
	view.listeners.reply({ context: "key-a", payload: { event: "colorSchemeSaved", requestId: writes[1].requestId, colorScheme: "vivid", saved: true } });
	assert.equal(view.scheme.value, "vivid");
	const reopened = inspector({ presentation: "double-ring", colorScheme: "vivid" });
	await flush();
	reopened.listeners.settings({ context: "key-a", payload: { settings: { presentation: "double-ring", colorScheme: "vivid" } } });
	reopened.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded",
		requestId: reopened.messages.find(message => message.event === "loadColorSchemes").requestId,
		colorSchemes: [{ id: "classic", label: "Classic" }, { id: "warm", label: "Warm" }, { id: "vivid", label: "Vivid" }] } });
	assert.equal(reopened.scheme.value, "vivid");
	const failed = inspector({ presentation: "double-ring", colorScheme: "classic" }, async payload => {
		if (payload.event === "selectColorScheme") throw new Error("write failed");
	});
	await flush();
	failed.listeners.settings({ context: "key-a", payload: { settings: { presentation: "double-ring", colorScheme: "classic" } } });
	failed.listeners.reply({ context: "key-a", payload: { event: "colorSchemesLoaded",
		requestId: failed.messages.find(message => message.event === "loadColorSchemes").requestId,
		colorSchemes: [{ id: "classic", label: "Classic" }, { id: "warm", label: "Warm" }] } });
	failed.scheme.value = "warm";
	await failed.handlers["scheme:input"]({ target: failed.scheme });
	await flush();
	assert.equal(failed.scheme.value, "classic");
});
