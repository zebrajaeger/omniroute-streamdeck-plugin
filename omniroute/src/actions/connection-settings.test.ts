import assert from "node:assert/strict";
import { test } from "node:test";
import streamDeck from "@elgato/streamdeck";
import { ConnectionSettingsAction } from "./connection-settings";

test("dialog save notifies the quota service only after global settings are saved", async () => {
	const originalSave = streamDeck.settings.setGlobalSettings;
	const originalSend = streamDeck.ui.sendToPropertyInspector;
	const calls: string[] = [];
	const settings = { url: "anything including invalid input", apiKey: "arbitrary text" };
	try {
		streamDeck.settings.setGlobalSettings = async saved => {
			assert.deepEqual(saved, settings);
			calls.push("saved");
		};
		streamDeck.ui.sendToPropertyInspector = async () => { calls.push("acknowledged"); };
		const action = new ConnectionSettingsAction(received => {
			assert.deepEqual(received, settings);
			calls.push("notified");
		});
		await action.onSendToPlugin({ payload: { event: "saveConnectionSettings", settings } } as any);
		assert.deepEqual(calls, ["saved", "notified", "acknowledged"]);
		streamDeck.settings.setGlobalSettings = async () => { throw new Error("save failed"); };
		await assert.rejects(action.onSendToPlugin({ payload: { event: "saveConnectionSettings", settings } } as any));
		assert.deepEqual(calls, ["saved", "notified", "acknowledged"]);
	} finally {
		streamDeck.settings.setGlobalSettings = originalSave;
		streamDeck.ui.sendToPropertyInspector = originalSend;
	}
});
