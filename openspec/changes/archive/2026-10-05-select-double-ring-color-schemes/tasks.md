## 1. Vorbereitung und Palette

- [x] 1.1 Vor Codeänderungen den Stand von `expand-double-ring-to-full-key` und `openspec/specs/quota-key-display/spec.md` mit diesem Delta abgleichen und für alle zu ändernden Symbole GitNexus-Impact prüfen; verifizieren, dass kein laufendes Ringlayout oder dessen Szenarien überschrieben wird.
- [x] 1.2 Zentrale Palette mit stabilen IDs (`classic`, `warm`, `vivid`), Labels, Außen-/Innenfarben und sicherem Default-Resolver unter `omniroute/src/quota-display/` erstellen; mit Unit-Tests für fehlende, fehlerhafte und unbekannte IDs sowie unterschiedliche Ringfarben verifizieren.
- [x] 1.3 Sieben weitere feste Paletten ergänzen (insgesamt zehn), ohne bestehende IDs/Farben zu ändern; Unit-, Renderer- und Action-Tests für alle zehn Optionen, eindeutige Farbpaare und die Auswahl der neuen IDs ausführen.

## 2. Rendering und Settings

- [x] 2.1 Die ausgewählte Palette über `quotaImage` bis zur Double-Ring-Präsentation weiterreichen und nur Ringakzente (auch beim ∞-Ring) färben; in `omniroute/src/quota-renderer.test.ts` Default-Farben, alle Paletten, unveränderte Ringfüllung, Sonder-/Fehlerzustände und die identische Textansicht prüfen.
- [x] 2.2 `QuotaAction` um Laden/Validieren/Speichern des pro-Taste-Settings `colorScheme` über den bestehenden serialisierten Schreibpfad erweitern und sichtbare Bilder sofort ohne zusätzliche Quota-Anfrage aktualisieren; in Action-Tests Settings-Erhalt, Unabhängigkeit zweier Tasten, ungültige Auswahl und unbekannten Altwert verifizieren.

## 3. Property Inspector und Gesamttest

- [x] 3.1 In `quota.html` ein offizielles `sdpi-select` für die Schemen ergänzen und in `provider-selector.js` Katalog, Anzeige nur für Double-Ring, Wiederherstellung und bestätigte Auswahl ohne implizites Überschreiben implementieren; in `provider-selector.test.ts` Standard-/Altwerte, Textwechsel, Neustart, schnelle Wechsel, verspätete Antworten und Speicherfehler prüfen.
- [x] 3.2 `npm test` und `npm run build` im Verzeichnis `omniroute` ausführen und die beiden Quota-Präsentationen einschließlich stale/recovery und mehrerer Tasten auf einer 72×72-Taste visuell in den Streamdeck Developer Tools prüfen; falls Tools nicht geöffnet sind, Nutzer um Öffnen bitten und manuelle Prüfung als ausstehend kennzeichnen.
