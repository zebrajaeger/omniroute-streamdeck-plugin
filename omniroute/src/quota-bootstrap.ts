import type { JsonObject } from "@elgato/utils";
import type { QuotaService } from "./quota-service";

type Settings = { url?: unknown; apiKey?: unknown };
export interface SettingsSDK {
	connect(): Promise<void>;
	settings: {
		getGlobalSettings(): Promise<JsonObject>;
		onDidReceiveGlobalSettings(listener: (event: { settings: JsonObject }) => void): { dispose(): void };
	};
}

/** Register before reading, then ignore the initial read if an event arrived meanwhile. */
export async function startQuotaService(sdk: SettingsSDK, service: Pick<QuotaService, "configure" | "stop">): Promise<() => void> {
	await sdk.connect();
	let revision = 0;
	let closed = false;
	const subscription = sdk.settings.onDidReceiveGlobalSettings(event => {
		if (closed) return;
		revision++;
		service.configure(event.settings as Settings);
	});
	const beforeRead = revision;
	try {
		const settings = await sdk.settings.getGlobalSettings();
		if (!closed && revision === beforeRead) service.configure(settings);
	} catch {
		if (!closed && revision === beforeRead) service.configure({});
	}
	return () => { closed = true; subscription.dispose(); service.stop(); };
}
