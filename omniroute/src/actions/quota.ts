import streamDeck, { action, SingletonAction, type SendToPluginEvent, type PropertyInspectorDidAppearEvent, type PropertyInspectorDidDisappearEvent, type WillAppearEvent, type WillDisappearEvent, type DidReceiveSettingsEvent, type KeyAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { logger } from "../logging";
import { ProviderRegistry } from "../provider-registry";
import { mergeConnectionId } from "../provider-selection";
import { quotaImage } from "../quota-renderer";
import { presentationOptions } from "../quota-display/catalog";
import { colorSchemeOptions } from "../quota-display/color-schemes";
import { normalizeDisplayName } from "../quota-display/model";
import type { QuotaService } from "../quota-service";

interface VisibleKey {
	readonly action: KeyAction<JsonObject>;
	settings: JsonObject;
	revision: number;
	lastImage?: string;
	pending?: string;
	writing: boolean;
}

type DiscoveryMessage = { event: "loadProviderConnections" | "loadPresentations" | "loadColorSchemes"; requestId: string } |
	{ event: "selectProviderConnection"; connectionId: string } |
	{ event: "selectPresentation"; presentation: string; requestId?: string } |
	{ event: "selectColorScheme"; colorScheme: string; requestId?: string } |
	{ event: "setDisplayName"; displayName: string; requestId?: string };

@action({ UUID: "de.lars-brandt.omniroute.quota" })
export class QuotaAction extends SingletonAction {
	private activeContext?: string;
	private activeVisit = 0;
	private readonly requests = new Map<string, string>();
	private readonly visible = new Map<string, VisibleKey>();
	// Keep the writer alive across a disappear/reappear with the same context ID.
	private readonly writers = new Map<string, Promise<void>>();
	private readonly settingWrites = new Map<string, Promise<unknown>>();
	constructor(private readonly registry: ProviderRegistry = new ProviderRegistry(),
		private readonly service?: Pick<QuotaService, "getState" | "subscribe">) {
		super();
		service?.subscribe(() => { for (const key of this.visible.values()) this.render(key); });
	}

	override onWillAppear(ev: WillAppearEvent): void {
		if (!ev.action.isKey()) return;
		const key: VisibleKey = { action: ev.action, settings: ev.payload.settings, revision: 0, writing: false };
		this.visible.set(ev.action.id, key);
		this.render(key);
		logger.debug("Quota action became visible");
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent): void {
		const key = this.visible.get(ev.action.id);
		if (!key) return;
		key.settings = ev.payload.settings;
		this.render(key);
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.visible.delete(ev.action.id);
	}

	private render(key: VisibleKey): void {
		if (!this.service) return;
		const image = quotaImage(this.service.getState(), key.settings.connectionId, key.settings.presentation, key.settings.displayName, key.settings.colorScheme);
		if (image === key.pending || (!key.writing && image === key.lastImage)) return;
		key.pending = image;
		key.revision++;
		if (key.writing) return;
		key.writing = true;
		const id = key.action.id;
		const previous = this.writers.get(id) ?? Promise.resolve();
		const write = previous.then(async () => {
			while (this.visible.get(id) === key && key.pending !== undefined) {
				const next = key.pending;
				const revision = key.revision;
				key.pending = undefined;
				try {
					await key.action.setTitle("");
					if (this.visible.get(id) !== key) break;
					if (revision !== key.revision) continue;
					await key.action.setImage(next);
					key.lastImage = next;
				} catch {
					// Do not log SDK errors: they may include settings or server data.
					logger.warn({ kind: "quota-render" }, "Quota key update failed");
					if (this.visible.get(id) === key) this.visible.delete(id);
					break;
				}
			}
		}).finally(() => {
			key.writing = false;
			if (this.writers.get(id) === write) this.writers.delete(id);
			// A settings change can queue an image after the loop exits but before this
			// finalizer runs. Restart the same writer path instead of losing that image.
			if (this.visible.get(id) === key && key.pending !== undefined) {
				key.pending = undefined;
				this.render(key);
			}
		});
		this.writers.set(id, write);
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
		if (message?.event === "loadPresentations") {
			if (typeof message.requestId !== "string" || !message.requestId) return;
			await streamDeck.ui.sendToPropertyInspector({ event: "presentationsLoaded", requestId: message.requestId, presentations: [...presentationOptions()] });
			return;
		}
		if (message?.event === "loadColorSchemes") {
			if (typeof message.requestId !== "string" || !message.requestId) return;
			await streamDeck.ui.sendToPropertyInspector({ event: "colorSchemesLoaded", requestId: message.requestId, colorSchemes: [...colorSchemeOptions()] });
			return;
		}
		if (message?.event === "selectProviderConnection" || message?.event === "selectPresentation" || message?.event === "selectColorScheme" || message?.event === "setDisplayName") {
			if (message.event === "selectProviderConnection" && typeof message.connectionId !== "string") return;
			if (message.event === "selectPresentation" && (typeof message.presentation !== "string" || !presentationOptions().some(item => item.id === message.presentation))) return;
			if (message.event === "selectColorScheme" && (typeof message.colorScheme !== "string" || !colorSchemeOptions().some(item => item.id === message.colorScheme))) return;
			if (message.event === "setDisplayName" && typeof message.displayName !== "string") return;
			const visit = this.activeVisit;
			const id = ev.action.id;
			const presentationRequestId = message.event === "selectPresentation" && typeof message.requestId === "string" ? message.requestId : undefined;
			const schemeRequestId = message.event === "selectColorScheme" && typeof message.requestId === "string" ? message.requestId : undefined;
			const nameRequestId = message.event === "setDisplayName" && typeof message.requestId === "string" ? message.requestId : undefined;
			const previous = this.settingWrites.get(id) ?? Promise.resolve();
			const write = previous.catch(() => {}).then(async () => {
				if (this.activeContext !== id || streamDeck.ui.action?.id !== id || this.activeVisit !== visit) return false;
				const settings = await ev.action.getSettings();
				if (this.activeContext !== id || streamDeck.ui.action?.id !== id || this.activeVisit !== visit) return false;
				let next: JsonObject;
				if (message.event === "selectProviderConnection") next = mergeConnectionId(settings, message.connectionId);
				else if (message.event === "selectPresentation") next = { ...settings, presentation: message.presentation as string };
				else if (message.event === "selectColorScheme") next = { ...settings, colorScheme: message.colorScheme as string };
				else {
					next = { ...settings };
					const name = normalizeDisplayName(message.displayName);
					if (name) next.displayName = name;
					else delete next.displayName;
				}
				await ev.action.setSettings(next);
				// Stream Deck does not echo plugin-initiated settings writes via onDidReceiveSettings.
				// Update the visible key through the existing revision-aware image writer.
				const key = this.visible.get(id);
				if (key) {
					key.settings = next;
					this.render(key);
				}
				return true;
			});
			this.settingWrites.set(id, write);
			try {
				const saved = await write;
				if (saved && presentationRequestId && this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "presentationSaved", requestId: presentationRequestId,
						presentation: message.event === "selectPresentation" ? message.presentation : "", saved: true });
				if (saved && schemeRequestId && this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "colorSchemeSaved", requestId: schemeRequestId,
						colorScheme: message.event === "selectColorScheme" ? message.colorScheme : "", saved: true });
				if (saved && nameRequestId && this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "displayNameSaved", requestId: nameRequestId, saved: true });
			}
			catch (error) {
				if (presentationRequestId &&
					this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "presentationSaved", requestId: presentationRequestId,
						presentation: message.event === "selectPresentation" ? message.presentation : "", saved: false });
				else if (schemeRequestId && this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "colorSchemeSaved", requestId: schemeRequestId,
						colorScheme: message.event === "selectColorScheme" ? message.colorScheme : "", saved: false });
				else if (nameRequestId && this.activeContext === id && streamDeck.ui.action?.id === id && this.activeVisit === visit)
					await streamDeck.ui.sendToPropertyInspector({ event: "displayNameSaved", requestId: nameRequestId, saved: false });
				else throw error;
			} finally { if (this.settingWrites.get(id) === write) this.settingWrites.delete(id); }
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
