const client = SDPIComponents.streamDeckClient;
const selector = document.querySelector("#provider-connection");
const statusElement = document.querySelector("#provider-status");
let selectedId = "";
let requestId;
let serial = 0;
let lastConfig;
let viewRevision = 0;
let activeContext;
let selectionPending;

function labelFor(item) {
	return `${item.name ? `${item.name} — ` : ""}${item.provider} (${item.connectionId})`;
}

function option(value, label, disabled = false) {
	const element = document.createElement("option");
	element.value = value;
	element.textContent = label;
	element.disabled = disabled;
	return element;
}

function render(status, connections = []) {
	selector.replaceChildren(option("", "No connection selected"));
	const available = status === "ready" || status === "empty";
	if (available) {
		for (const item of connections) selector.append(option(item.connectionId, labelFor(item)));
	}
	if (selectedId && !connections.some(item => item.connectionId === selectedId)) {
		selector.append(option(selectedId, `Unavailable connection (${selectedId})`, !available));
	}
	selector.value = selectedId || "";
	selector.disabled = !available;
	const messages = {
		loading: "Loading provider connections…", ready: "Select a provider connection.",
		empty: "No provider connections are available.", unconfigured: "Configure the OmniRoute connection first.",
		"invalid-configuration": "The OmniRoute connection settings are invalid.",
		authentication: "Authentication failed. Check the OmniRoute API key.",
		unavailable: "OmniRoute is unavailable. Try reloading.", http: "Could not load connections. Try reloading.",
		"invalid-response": "OmniRoute returned an invalid connection list.",
	};
	statusElement.textContent = selectedId && available && !connections.some(item => item.connectionId === selectedId)
		? `Saved connection ${selectedId} is unavailable. Select another or clear it.` : messages[status] || "";
}

async function loadProviderConnections() {
	const id = `${++serial}-${Date.now()}`;
	requestId = id;
	render("loading");
	const context = activeContext;
	try { await client.send("sendToPlugin", { event: "loadProviderConnections", requestId: id }); }
	catch { if (requestId === id && activeContext === context) render("unavailable"); }
}

async function restoreSelection() {
	const revision = ++viewRevision;
	const result = await client.getSettings();
	if (revision !== viewRevision) return;
	selectedId = typeof result.settings?.connectionId === "string" ? result.settings.connectionId : "";
	render("loading");
	// getSettings emits didReceiveSettings; its context identifies the current inspector.
	if (activeContext && !requestId) await loadProviderConnections();
}

selector.addEventListener("change", async () => {
	const id = selector.value;
	selectedId = id;
	selectionPending = id;
	try { await client.send("sendToPlugin", { event: "selectProviderConnection", connectionId: id }); }
	catch { selectionPending = undefined; render("unavailable"); }
});
document.querySelector("#reload-providers").addEventListener("click", loadProviderConnections);
client.sendToPropertyInspector.subscribe(message => {
	if (message.context !== activeContext) return;
	const payload = message.payload;
	if (payload?.event === "providerConnectionsInvalidated") { void loadProviderConnections(); return; }
	if (payload?.event === "providerConnectionsLoaded" && payload.requestId === requestId) render(payload.status, payload.connections);
});
client.didReceiveGlobalSettings.subscribe(message => {
	const { url, apiKey } = message.payload.settings;
	const next = JSON.stringify([url, apiKey]);
	if (lastConfig !== undefined && lastConfig !== next) void loadProviderConnections();
	lastConfig = next;
});
client.didReceiveSettings.subscribe(message => {
	if (!activeContext) activeContext = message.context;
	if (message.context !== activeContext) return;
	if (selectionPending !== undefined) {
		if (message.payload.settings?.connectionId === selectionPending || (!selectionPending && !message.payload.settings?.connectionId)) selectionPending = undefined;
		else return;
	}
	selectedId = typeof message.payload.settings?.connectionId === "string" ? message.payload.settings.connectionId : "";
	selector.value = selectedId || "";
	if (!requestId) void loadProviderConnections();
});
void restoreSelection();
