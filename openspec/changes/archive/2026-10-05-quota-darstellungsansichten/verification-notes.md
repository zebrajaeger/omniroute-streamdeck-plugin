# Nachweise und offene Sichtprüfung

## GitNexus-Impact vor den jeweiligen Code-Edits

- Der Index wurde mit `node .gitnexus/run.cjs analyze --index-only` aktualisiert. Vor dem Umbau ergaben `quotaRenderModel`, `quotaSvg` und `quotaImage` jeweils **HIGH**: direkte Kette über `quotaImage` bzw. `QuotaAction.render`, betroffene Prozesse `constructor`, `onDidReceiveSettings`, `onWillAppear`. `QuotaAction` war LOW; der direkte Aufrufer ist `plugin.ts`. Vor späteren Änderungen wurden u. a. `doubleRingSvg` (**HIGH**, direkter Katalog-/Bild-Dispatch, dieselben drei Prozesse) und `QuotaAction.render` (**HIGH**, direkte Aufrufer constructor/settings/appear) erneut geprüft. Risiken werden nicht über `riskSharedAxes` herabgestuft. Die Auswirkungen sind mit Renderer-, Lifecycle- und Service-Tests abgedeckt.
- `QuotaAction.onSendToPlugin`, `quotaSvg`, `provider-selector.js` und `quota.html` meldeten teilweise **UNKNOWN** (unaufgelöste SDK- bzw. Browser-Ereignisse). Quellsuche bestätigte `onSendToPlugin` als SDK-Override und die Inspector-`sendToPlugin`-Nachrichten samt Action-Tests; `quotaSvg` wird in Renderer-Tests verwendet; `provider-selector.js` ist in `quota.html` eingebunden, welches `manifest.json` als PropertyInspectorPath referenziert. UNKNOWN wurde nicht als unbenutzt gewertet.

## Delta-Spec zu Tests

| Anforderung/Szenarien | Nachweis |
| --- | --- |
| Zugeordnete Snapshots, zwei Konten, Wiedererscheinen, Updates ohne eigene Requests | `actions/quota-display.test.ts` (Abonnement, Instanzen, langsam serialisierte Writes, Settings/Name) |
| Sortierung, zwei Fenster, Overflow, Prozentwerte, Sonderwerte und Textkompatibilität | `quota-renderer.test.ts` (inkl. exaktem bisherigem Text-SVG), `quota-model.test.ts` |
| Präsentationskatalog, Text-Fallback, zusätzliche Option und persistierte Einstellungen | `quota-renderer.test.ts`, `actions/quota.test.ts`, `provider-selector.test.ts` |
| Namens-Prefill, Override/Reset, Wechsel, HTML/XML-Sicherheit, verzögerte Antworten | `quota-renderer.test.ts`, `provider-selector.test.ts` |
| Ringgeometrie, Stile, 0/100/Bruchteile, Status und Stale/Recovery/Instanzwechsel | `quota-renderer.test.ts`, `actions/quota-display.test.ts` |

## Offener manueller Nachweis (Aufgabe 5.3)

Bei der realen Bedienung wurde ein Fehler gefunden: Der Inspector schrieb `presentation: double-ring` in die Action-Settings, aber die sichtbare Taste blieb Text. Ein Debugger-Breakpoint im laufenden Plugin zeigte, dass der Settings-Schreibpfad ausgeführt wurde, während `onDidReceiveSettings` und der Bildrenderer beim Wechsel nicht aufgerufen wurden. Ein Regressionstest ohne SDK-Settings-Echo reproduzierte das Verhalten rot und nach der Korrektur grün (`npx tsx --test src/actions/quota.test.ts`). Die Action übernimmt nach erfolgreichem `setSettings` nun die gespeicherten Settings für die sichtbare Taste und nutzt denselben Bildwriter; dessen Finalizer verarbeitet auch Updates, die zwischen dem letzten Loop-Durchlauf und `finally` eintreffen. 47 Tests, Typecheck und Build waren danach erfolgreich; das Plugin wurde neu gestartet. Die Einstellungen beider Quota-Tasten blieben unabhängig. Die tatsächliche Ringdarstellung am Gerät muss nach dem Neustart noch bestätigt werden.

`StreamDeck.exe` und `npm run watch`/Rollup liefen; das Plugin ist per Junction installiert. Über den Stream-Deck-DevTools-Endpunkt `localhost:23654` wurde der echte Property Inspector mit `Text`/`Double ring`-Optionen und automatisch angezeigtem Provider-Namen kontrolliert. Beim anschließenden Versuch war kein OmniRoute-Inspector-Ziel mehr geöffnet. Die 72×72-Tastengrafik selbst, Sonderwerte und gleichzeitig sichtbare Stale-/Overflow-Markierungen sowie Settings-Wechsel und Plugin-Restart konnten dadurch **nicht** am Gerät in Originalgröße geprüft werden. Aufgabe 5.3 bleibt offen; bitte den Inspector der betreffenden Quota-Taste geöffnet lassen und am Gerät Sichtprüfung durchführen.
