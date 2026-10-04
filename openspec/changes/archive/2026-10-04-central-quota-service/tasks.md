## 1. Vertragsprüfung und Datenmodell

- [x] 1.1 Vor Codeänderungen GitNexus-Index aktualisieren und Impact für betroffene bestehende Symbole, insbesondere Plugin-Einstieg, ausführen; Callers/Prozesse/Risiko dokumentieren und UNKNOWN mit gezielter Quellprüfung auflösen.
  - GitNexus-Index aktualisiert: `omniroute/src/plugin.ts` hat 0 aufgelöste Caller und 0 Prozesse, Risiko **UNKNOWN**. Quellprüfung: `omniroute/rollup.config.mjs` bindet die Datei als Bundle-Einstieg ein; SDK-Lifecycle erfolgt zur Laufzeit, der Graph kann daraus keine Entwarnung ableiten.
  - `QuotaAction`: 1 aufgelöster Caller (`plugin.ts`), 0 Prozesse, Risiko **LOW**. Der geplante Eingriff betrifft den Bootstrap, nicht den Save-Handler der ConnectionSettingsAction.
- [x] 1.2 Den Snapshot-Vertrag von `/api/usage/om-usage?format=json` gezielt über die gespeicherte Verbindung prüfen und eine bereinigte Fixture ohne Credentials oder echte Accountdaten anlegen; verifizieren, dass `providers`, `connectionId` und Quota-Fenster dem Konzept entsprechen, andernfalls Spec-Abweichung vor Implementierung klären.
- [x] 1.3 `src/quota-model.ts` für generische Fenster und nicht mutierbare Snapshots implementieren; Tests für zwei gleiche Provider mit verschiedenen IDs, leere Listen, Duplikate/fehlende IDs und ungültige optionale Felder bestehen lassen.
- [x] 1.4 Prozentnormalisierung implementieren; Tests für explizite Prozente, remaining/total, used/total, Null, Clamping, fehlende Bezugsgröße, unbekannt und unlimited bestehen lassen.

## 2. HTTP und zentraler Dienst

- [x] 2.1 `src/omniroute-client.ts` mit injizierbarem Fetch, Instanz-Basispfad, Bearer-Header und 10-Sekunden-Timeout implementieren; Tests für Endpoint/Query, Slash-Varianten, Redirect-Sperre und ungültige HTTP(S)-Konfiguration bestehen lassen.
- [x] 2.2 Sichere Fehlerklassifikation ergänzen; Tests für 401/403, Netzwerk/Timeout, andere HTTP-Fehler und fehlerhaftes JSON sowie Log-Capture ohne API-Key, URL oder Responsebody bestehen lassen.
- [x] 2.3 `src/quota-service.ts` mit Erstabfrage, Single-flight und 20 Sekunden nach Abschluss erneutem Refresh implementieren; deterministische Scheduler-Tests bestätigen einen Request für mehrere Verbraucher und keine Überlappung.
- [x] 2.4 Cache, Subscription, Zeitstempel und stale/Recovery umsetzen; Tests bestätigen atomaren Austausch einschließlich leerem Snapshot, letzten Erfolg bei Fehler, initiale Subscriber-Ausgabe, Unsubscribe und Isolation fehlerhafter Subscriber.
- [x] 2.5 Konfigurationsgenerationen und Stop/Dispose implementieren; Tests bestätigen Cache-Löschung, sofortige neue Abfrage, verworfene Late Results, keine Neustarts bei identischen Settings und keine Timer/Publikationen nach Stop.

## 3. SDK-Integration und Verifikation

- [x] 3.1 Den Singleton in `src/plugin.ts` an SDK-Ready und globale Settings-Events anschließen, ohne Save-Validierung zu ändern; Integrationstests mit SDK-Fake prüfen Initialread-Race und Settings-Wechsel aus beiden vorhandenen Einstellungswegen.
- [x] 3.2 In `omniroute` `npm test`, `npx tsc --noEmit` und `npm run build` ausführen; alle Befehle erfolgreich abschließen und bestätigen, dass keine Provider-Auswahl oder Quota-Anzeige vorweggenommen wurde.
- [x] 3.3 Mit geöffneten Stream Deck Developer Tools und laufendem `npm run watch` Erstabfrage, genau einen Polling-Zyklus für mehrere Tasten und Übernahme gespeicherter Settings prüfen; bei geschlossenen Tools Nutzer um Öffnen bitten und nur bereinigte Ergebnisse festhalten.
  - Live-Prüfung mit geöffneten Developer Tools und laufendem Watch: der installierte Plugin-Prozess zeigte eine Erstabfrage und danach jeweils genau einen Request pro ~20 Sekunden (Beispiel: Start bei 0, 20, 40 und 60 Sekunden; keine zusätzliche Polling-Schleife bei zwei vom Nutzer platzierten Quota-Tasten). Die installierte Bundle-Datei entsprach der gebauten Datei.
  - Der Nutzer hat die bereits gespeicherten Werte im Verbindungsdialog unverändert erneut gespeichert. Die beobachtete Requestfolge blieb ohne zusätzlichen Refresh, wie für identische Settings vorgesehen; die Übernahme aus dem Dialog nach erfolgreichem SDK-Save und der direkte globale Settings-Event sind zusätzlich durch Integrationstests belegt. Keine Zugangsdaten, URLs aus Antworten oder echten Accountdaten wurden festgehalten.
