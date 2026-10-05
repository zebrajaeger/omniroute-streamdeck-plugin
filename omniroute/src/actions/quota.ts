import streamDeck, { action, SingletonAction, type SendToPluginEvent, type PropertyInspectorDidAppearEvent, type PropertyInspectorDidDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { logger } from "../logging";
import { ProviderRegistry } from "../provider-registry";
import { mergeConnectionId } from "../provider-selection";

type DiscoveryMessage = { event: "loadProviderConnections"; requestId: string } | { event: "selectProviderConnection"; connectionId: string };

@action({ UUID: "de.lars-brandt.omniroute.quota" })
export class QuotaAction extends SingletonAction {
	private activeContext?: string;
	private activeVisit = 0;
	private readonly requests = new Map<string, string>();
	constructor(private readonly registry: ProviderRegistry = new ProviderRegistry()) { super(); }

	override onWillAppear(): void {
		logger.debug("Quota action became visible");
	}

	override onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent): void {
		this.activeContext = ev.action.id;
		this.activeVisit++;
		this.requests.delete(ev.action.id);
	}

	override onPropertyInspectorDidDisappear(ev: PropertyInspectorDidDisappearEvent): void {
		if (this.activeContext === ev.action.id) { this.activeContext = undefined; this.activeVisit++; }
		this.requests.delete(ev.action.id);
	}

	/** Shared settings events may arrive while a discovery request is in flight. */
	configure(settings: { url?: unknown; apiKey?: unknown }): void {
		const previous = this.registry.getGeneration();
		this.registry.configure(settings);
		if (this.registry.getGeneration() !== previous) {
			this.requests.clear();
			if (this.activeContext && streamDeck.ui.action?.id === this.activeContext)
				void streamDeck.ui.sendToPropertyInspector({ event: "providerConnectionsInvalidated" });
		}
	}

	override async onSendToPlugin(ev: SendToPluginEvent<DiscoveryMessage, JsonObject>): Promise<void> {
		if (this.activeContext !== ev.action.id || streamDeck.ui.action?.id !== ev.action.id) return;
		const message = ev.payload;
		if (message?.event === "selectProviderConnection") {
			if (typeof message.connectionId !== "string") return;
			const visit = this.activeVisit;
			const settings = await ev.action.getSettings();
			if (this.activeContext !== ev.action.id || streamDeck.ui.action?.id !== ev.action.id || this.activeVisit !== visit) return;
			await ev.action.setSettings(mergeConnectionId(settings, message.connectionId));
			return;
		}
		if (message?.event !== "loadProviderConnections" || typeof message.requestId !== "string" || !message.requestId) return;
		const context = ev.action.id;
		const visit = this.activeVisit;
		this.requests.set(context, message.requestId);
		const generation = this.registry.getGeneration();
		const state = await this.registry.load();
		if (this.activeContext !== context || streamDeck.ui.action?.id !== context || this.activeVisit !== visit ||
			this.requests.get(context) !== message.requestId || this.registry.getGeneration() !== generation) return;
		await streamDeck.ui.sendToPropertyInspector({ event: "providerConnectionsLoaded", requestId: message.requestId,
			status: state.status, connections: state.connections.map(item => ({ ...item })) });
	}
}
