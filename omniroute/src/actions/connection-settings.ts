import { action, SingletonAction, type SendToPluginEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";

type ConnectionSettings = {
	url: string;
	apiKey: string;
};
type ConnectionMessage = {
	event: string;
	settings?: {
		url?: string;
		apiKey?: string;
	};
};

@action({ UUID: "de.lars-brandt.omniroute.connection-settings" })
export class ConnectionSettingsAction extends SingletonAction {
	override async onSendToPlugin(ev: SendToPluginEvent<ConnectionMessage, ConnectionSettings>): Promise<void> {
		const message = ev.payload;
		if (message.event === "loadConnectionSettings") {
			const settings = await this.getSavedSettings();
			await streamDeck.ui.sendToPropertyInspector({ event: "connectionSettingsLoaded", settings });
			return;
		}

		if (message.event === "saveConnectionSettings") {
			const settings: Required<ConnectionSettings> = {
				url: typeof message.settings?.url === "string" ? message.settings.url : "",
				apiKey: typeof message.settings?.apiKey === "string" ? message.settings.apiKey : "",
			};
			await streamDeck.settings.setGlobalSettings(settings);
			await streamDeck.ui.sendToPropertyInspector({ event: "connectionSettingsSaved", settings });
		}
	}

	private async getSavedSettings(): Promise<ConnectionSettings> {
		const settings = await streamDeck.settings.getGlobalSettings<JsonObject>();
		return {
			url: typeof settings.url === "string" ? settings.url : "",
			apiKey: typeof settings.apiKey === "string" ? settings.apiKey : "",
		};
	}
}
