## 1. Voraussetzungen und Renderer

- [x] 1.1 Verifizierte Implementierungen von `central-quota-service` und `quota-provider-selection` sowie vorgelagerten Platzhalter-Spec-Sync bestätigen; GitNexus-Impact für QuotaAction/Plugin-Einstieg ausführen und Risiko einschließlich dynamischer SDK-Grenzen dokumentieren.
  - Beide Vorgänger sind archiviert und verifiziert; die Haupt-Spec `quota-placeholder` enthält das vorgelagerte MODIFIED-Delta. Baseline: 28/28 Tests bestanden. Index mit `analyze --index-only` aktualisiert; CLI-Impact: `QuotaAction` LOW, direkter Aufrufer `plugin.ts`, keine erfassten Prozesse. `plugin.ts` und `onWillAppear` UNKNOWN: Quellprüfung bestätigt Rollup-Einstieg bzw. SDK-Lifecycle-Aufruf. Dynamische SDK-Dispatch-Grenzen werden durch Lifecycle-/Async-Tests und Live-Prüfung abgedeckt, nicht als Entwarnung ausgelegt.
- [x] 1.2 `src/quota-renderer.ts` mit Render-Modell nach `connectionId` implementieren; Tests bestätigen getrennte Daten zweier gleicher Provider, Provider/Plan-Heading und keine Werte anderer Accounts.
- [x] 1.3 Lexikografische Auswahl zweier Fenster, gekürzte eindeutige Labels, gerundete Prozente, `∞`, `?`, `0%` und `+N` implementieren; Tests mit Codex und generischen drei Fenstern bestehen lassen.
- [x] 1.4 72×72-SVG/Data-URL erstellen, Labels escapen und Wertespalte freihalten; Snapshot-/Escape-Tests bestätigen keine abgeschnittenen Werte, gültiges SVG und keine injizierbaren XML-Inhalte.
- [x] 1.5 Statusprioritäten für unzugeordnet, unkonfiguriert, ungültige URL, Laden, fehlende ID, leere Quotas, Auth, Offline, invalid response und stale/Recovery implementieren; tabellarische Tests bestätigen eindeutige Texte ohne erfundene Quotas oder Token-Diagnosen.
  - Vier Renderer-Tests bestanden: Account-Isolation, generische/codepoint-sortierte Fenster und Overflow, tabellarische Status-/Stale-Prüfung sowie exakter SVG-Snapshot mit XML-Escaping und fester Wertespalte.

## 2. Action-Lifecycle und SDK-Ausgabe

- [x] 2.1 Service in QuotaAction injizieren und sichtbare Kontexte über onWillAppear/onDidReceiveSettings/onWillDisappear verwalten; SDK-Fake-Tests bestätigen initialen Zustand, Zuordnungswechsel und keine Updates an versteckte Tasten.
- [x] 2.2 Eine Service-Subscription mit geordneter Ausgabe pro Taste, `setImage` und kontrolliertem Titel verdrahten; Async-Tests bestätigen, dass alte Renders neuere Werte nicht übermalen und identische Ausgaben nicht wiederholt gesendet werden.
- [x] 2.3 Stale-Werte plus sichtbares `Alt`/Fehlerkürzel und Entfernung alter Werte beim Konfigurationswechsel verifizieren; Tests bestätigen Recovery und unveränderte HTTP-Requestzahl bei mehreren Tasten.
  - Fünf SDK-Fake-/Service-Integrationstests bestanden, einschließlich langsamer Bild-/Titelschreibvorgänge, Wiedererscheinen desselben Kontexts, Fehlerisolation, Cache-Löschung und exakt einer zentralen Timerfolge ohne Requests der Action.
- [x] 2.4 Quota-Tooltip im Manifest aktualisieren; Diff-Prüfung bestätigt unveränderte Action-UUID, Inspector-Zuordnung, Controller und andere Actions.
  - Manifest-Diff enthält ausschließlich den neuen Quota-Tooltip.

## 3. Gesamtverifikation

- [x] 3.1 In `omniroute` `npm test`, `npx tsc --noEmit` und `npm run build` erfolgreich ausführen; Testfälle allen neuen Spec-Szenarien zuordnen.
  - 37/37 Tests, Typecheck und Build erfolgreich. Vollständige Zuordnung der elf neuen Spec-Szenarien in `verification.md`.
- [x] 3.2 Mit geöffneten Stream Deck Developer Tools und laufendem `npm run watch` zwei Accounts, Profilwechsel und Settings-Wechsel prüfen; sichtbare Zuordnung und Lifecycle ohne zusätzliche Polling-Schleifen dokumentieren.
  - Nutzer bestätigte am 2026-10-05 die getrennte Anzeige zweier Accounts sowie korrekte Profil-/Zuordnungswechsel und den Lifecycle versteckter Tasten. Developer Tools und Watch waren zuvor bestätigt; keine zusätzlichen Polling-Schleifen durch Service-/Action-Integrationstests belegt.
- [x] 3.3 72×72-Lesbarkeit mit langen Labels, zwei Fenstern, Overflow, unlimited und unknown prüfen sowie kontrollierte Offline/Auth/Recovery-Antworten durchspielen; keine Zugangsdaten in Bild oder Logs nachweisen und reale Provider-Konfiguration unangetastet lassen.
  - Nutzer bestätigte am 2026-10-05 lesbare lange Labels, zwei Fenster, +N, ∞ und ? ohne abgeschnittene Werte sowie kontrollierte Offline/Auth/Recovery-Zustände mit korrekter Alt-/Fehlermarkierung und unveränderter realer Provider-Konfiguration. Renderer-/Log-Tests belegen bereinigte Ausgaben; der Action-Fehlerpfad protokolliert ausschließlich feste Kategorie und Meldung, keine SDK-Fehlerdetails.
