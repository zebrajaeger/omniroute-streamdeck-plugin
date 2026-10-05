const client = SDPIComponents.streamDeckClient;
const selector = document.querySelector("#provider-connection");
const statusElement = document.querySelector("#provider-status");
const presentationSelector = document.querySelector("#quota-presentation");
const nameField = document.querySelector("#quota-display-name");
let selectedId = "";
let customName = "";
let presentation = "text";
let presentationPending;
let presentationRequestId;
let confirmedPresentation = "text";
let presentationRevision = 0;
let namePending;
let names = new Map();
let catalog = [{ id: "text", label: "Text" }];
let catalogRequestId;
let catalogReady = false;
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
	names = new Map(connections.map(item => [item.connectionId, item.provider]));
	updateName();
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

function updateName() {
	if (namePending !== undefined) return;
	nameField.value = customName || names.get(selectedId) || "";
}

function updatePresentation() {
	presentationSelector.replaceChildren(...catalog.map(item => option(item.id, item.label)));
	presentationSelector.value = catalog.some(item => item.id === presentation) ? presentation : "text";
	presentationSelector.disabled = !catalogReady;
}

function confirmPresentation(value) {
	confirmedPresentation = value;
	if (presentationPending === undefined || presentationPending === value) {
		presentation = value;
		updatePresentation();
	}
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
	if (presentationPending === undefined) {
		const saved = typeof result.settings?.presentation === "string" ? result.settings.presentation : "text";
		confirmPresentation(saved);
	}
	if (namePending === undefined) customName = typeof result.settings?.displayName === "string" ? result.settings.displayName.trim() : "";
	updatePresentation();
	updateName();
	render("loading");
	// getSettings emits didReceiveSettings; its context identifies the current inspector.
	if (activeContext && !requestId) await loadProviderConnections();
}

selector.addEventListener("change", async () => {
	const id = selector.value;
	selectedId = id;
	updateName();
	selectionPending = id;
	try { await client.send("sendToPlugin", { event: "selectProviderConnection", connectionId: id }); }
	catch { selectionPending = undefined; render("unavailable"); }
});
async function selectPresentation(event) {
	// sdpi-select dispatches input from its shadow <select> before updating the host value.
	const value = event.composedPath?.().find(item => item?.tagName === "SELECT")?.value ??
		presentationSelector.shadowRoot?.querySelector("select")?.value ?? presentationSelector.value;
	if (!catalogReady || !catalog.some(item => item.id === value) || value === presentation) return;
	presentation = value;
	presentationPending = value;
	const id = `${++serial}-${Date.now()}`;
	presentationRequestId = id;
	const revision = ++presentationRevision;
	updatePresentation();
	try { await client.send("sendToPlugin", { event: "selectPresentation", presentation: value, requestId: id }); }
	catch {
		if (presentationRevision === revision) {
			presentationRequestId = undefined;
			presentationPending = undefined;
			void restoreSelection();
		}
	}
}
presentationSelector.addEventListener("input", selectPresentation);
presentationSelector.addEventListener("change", selectPresentation);
nameField.addEventListener("change", async () => {
	const value = nameField.value.trim();
	customName = value;
	namePending = value;
	if (!value) nameField.value = names.get(selectedId) || "";
	try { await client.send("sendToPlugin", { event: "setDisplayName", displayName: value }); }
	catch { namePending = undefined; }
});
document.querySelector("#reload-providers").addEventListener("click", loadProviderConnections);
client.sendToPropertyInspector.subscribe(message => {
	if (message.context !== activeContext) return;
	const payload = message.payload;
	if (payload?.event === "presentationsLoaded" && payload.requestId === catalogRequestId && Array.isArray(payload.presentations)) {
		const options = payload.presentations.filter(item => typeof item?.id === "string" && typeof item.label === "string");
		if (!options.some(item => item.id === "text")) return;
		catalog = options;
		catalogReady = true;
		updatePresentation();
		return;
	}
	if (payload?.event === "presentationSaved" && payload.requestId === presentationRequestId) {
		presentationRequestId = undefined;
		presentationPending = undefined;
		if (payload.saved) confirmPresentation(payload.presentation);
		else {
			void restoreSelection();
		}
		return;
	}
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
	const settings = message.payload.settings || {};
	if (selectionPending !== undefined) {
		if (settings.connectionId === selectionPending || (!selectionPending && !settings.connectionId)) selectionPending = undefined;
		else return;
	}
	if (!catalogRequestId) {
		catalogRequestId = `${++serial}-${Date.now()}`;
		void client.send("sendToPlugin", { event: "loadPresentations", requestId: catalogRequestId });
	}
	const nextPresentation = typeof settings.presentation === "string" ? settings.presentation : "text";
	if (presentationPending === undefined || presentationPending === nextPresentation) {
		if (presentationPending === nextPresentation) presentationPending = undefined;
		confirmPresentation(nextPresentation);
	}
	const nextName = typeof settings.displayName === "string" ? settings.displayName.trim() : "";
	if (namePending === undefined || namePending === nextName) {
		namePending = undefined;
		customName = nextName;
		updateName();
	}
	selectedId = typeof settings.connectionId === "string" ? settings.connectionId : "";
	selector.value = selectedId || "";
	updateName();
	if (!requestId) void loadProviderConnections();
});
void restoreSelection();
