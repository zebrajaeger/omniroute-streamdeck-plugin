import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const script = readFileSync(new URL("../de.lars-brandt.omniroute.sdPlugin/ui/provider-selector.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../de.lars-brandt.omniroute.sdPlugin/ui/quota.html", import.meta.url), "utf8");

function inspector(saved: Record<string, unknown> = {}) {
	const handlers: Record<string, (event: any) => void> = {};
	const select = {
		children: [] as any[], value: "", disabled: false,
		replaceChildren(...items: any[]) { this.children = items; }, append(item: any) { this.children.push(item); },
		addEventListener(event: string, callback: (event: any) => void) { handlers[`select:${event}`] = callback; },
	};
	const reload = { addEventListener(event: string, callback: (event: any) => void) { handlers[`reload:${event}`] = callback; } };
	const status = { textContent: "" };
	const messages: any[] = [];
	const listeners: Record<string, (message: any) => void> = {};
	const client = {
		getSettings: async () => ({ settings: saved }),
		send: async (_event: string, payload: any) => { messages.push(payload); },
		sendToPropertyInspector: { subscribe: (fn: any) => { listeners.reply = fn; } },
		didReceiveGlobalSettings: { subscribe: (fn: any) => { listeners.global = fn; } },
		didReceiveSettings: { subscribe: (fn: any) => { listeners.settings = fn; } },
	};
	const document = {
		querySelector: (selector: string) => selector === "#provider-connection" ? select : selector === "#provider-status" ? status : reload,
		createElement: (_tag: string) => ({ value: "", textContent: "", disabled: false }),
	};
	vm.runInNewContext(script, { document, SDPIComponents: { streamDeckClient: client }, Date });
	return { select, status, messages, listeners, handlers };
}

async function flush() { await new Promise(resolve => setTimeout(resolve, 0)); }

test("DOM uses official selector/button, safe text labels and preserves modal controls", async () => {
	assert.match(html, /<sdpi-select id="provider-connection"/);
	assert.match(html, /<sdpi-button id="reload-providers"/);
	for (const control of ["openConnectionSettings()", "cancelConnectionSettings()", "saveConnectionSettings()", "connection-dialog"]) assert.ok(html.includes(control));
	const view = inspector();
	await flush();
	view.listeners.settings({ context: "key-a", payload: { settings: {} } });
	assert.equal(view.messages[0].event, "loadProviderConnections");
	view.listeners.reply({ context: "key-a", payload: { event: "providerConnectionsLoaded", requestId: view.messages[0].requestId,
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
	const firstId = view.messages[0].requestId;
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
