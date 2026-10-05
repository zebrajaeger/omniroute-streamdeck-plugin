## 1. Fehler reproduzieren

- [x] 1.1 In den Stream Deck Developer Tools die Auswahl in `#quota-presentation` von Text zu Double ring betätigen und Eventtyp, `value`, Plugin-Nachricht sowie tatsächliche Action-Settings prüfen; als Nachweis festhalten, an welcher Grenze der Ablauf abbricht (falls Tools geschlossen sind, Nutzer um Öffnen bitten).
- [x] 1.2 Einen zunächst fehlschlagenden Regressionstest an der betroffenen Grenze in `omniroute/src/provider-selector.test.ts` bzw. `omniroute/src/actions/quota.test.ts` ergänzen; verifizieren, dass er genau den beobachteten Defekt statt nur einen simulierten `change`-Callback abbildet.

## 2. Auswahl und Rendering reparieren

- [x] 2.1 Den nachgewiesenen Event-/Settings-Fehler in `provider-selector.js` und/oder `QuotaAction` minimal beheben; mit dem Regressionstest bestätigen, dass Auswahl und Speichern von `double-ring` sowie Rückwechsel zu `text` funktionieren und fremde Action-Settings erhalten bleiben.
- [x] 2.2 Den UI-Zustand bei verspäteten Settings-/Katalogantworten und fehlgeschlagenem Write konsistent halten; mit Tests für schnelle Wechsel, Fehlerfall und Wiederöffnung prüfen, dass keine veraltete oder ungespeicherte Auswahl als bestätigt erscheint.
- [x] 2.3 Den Anzeigewechsel einer sichtbaren Taste nach dem erfolgreichen Settings-Write in `quota-display.test.ts` bzw. `quota.test.ts` absichern; verifizieren, dass der vorhandene Quota-Zustand verwendet wird und andere Tasten sowie Quota-Request-Zahl unverändert bleiben.

## 3. Integration prüfen

- [x] 3.1 Im Verzeichnis `omniroute` `npm test` und `npm run build` ausführen; Erfolg der Tests und des Builds prüfen, einschließlich Fallback für fehlende/ungültige Präsentations-IDs.
- [ ] 3.2 `npm run watch` im Plugin-Verzeichnis sicherstellen und nach automatischem Plugin-Neuladen im Stream Deck die Umschaltung in beide Richtungen, unabhängige zweite Taste und Wiederöffnung des Property Inspectors beobachten; prüfen, dass Auswahl, gespeicherte Einstellung und Tastenbild übereinstimmen.
