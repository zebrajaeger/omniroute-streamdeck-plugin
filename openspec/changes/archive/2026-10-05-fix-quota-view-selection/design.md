## Context

Siehe `proposal.md` für den Anlass und `specs/quota-key-display/spec.md` für das gewünschte Verhalten. `quota.html` verwendet ein `sdpi-select` für `#quota-presentation`; `provider-selector.js` lädt Optionen über `loadPresentations`, behandelt bisher `change` und sendet `selectPresentation` an das Plugin. `QuotaAction.onSendToPlugin` validiert die ID gegen `presentationOptions()`, serialisiert Settings-Schreibvorgänge pro Taste und ruft nach `setSettings` selbst `render` auf, da pluginseitige Writes kein `onDidReceiveSettings` auslösen. `quotaImage` wählt die Darstellung aus den Action-Settings. Die vorhandenen Tests simulieren vor allem manuelle `change`-Callbacks und Plugin-Events; sie belegen nicht, dass ein reales `sdpi-select` dieselben Events liefert oder keine konkurrierende automatische Settings-Bindung ausführt. Die Ursache des gemeldeten Fehlers ist damit noch nicht nachgewiesen.

## Goals / Non-Goals

**Goals:**
- Den tatsächlichen Inspector-Event-/Settings-Pfad reproduzierbar erfassen und genau dort korrigieren.
- Per-Key-Settings-Write und unmittelbares Rendering synchron mit der bestätigten Auswahl halten, auch bei raschen Wechseln und verzögerten Antworten.
- Einen Regressionstest für Auswahl, Speicherung und Darstellung ergänzen, der den ermittelten Fehler tatsächlich reproduziert.

**Non-Goals:**
- Neue Darstellungen, neue Quota-Abfragen oder Änderungen am Renderlayout.
- Präsentation in globalen Settings oder in Zugangsdaten speichern.

## Decisions

1. **Bestehende pro-Key-Pipeline beibehalten, zuerst Event-Grenze verifizieren.** Bei der Umsetzung mit Stream Deck Developer Tools prüfen, ob die Interaktion ein `change`-Event am `sdpi-select` mit dem erwarteten `value` auslöst und ob eine SDPI-Default-Bindung Action-Settings überschreibt. Ergebnis mit einem reproduzierenden Test an der relevanten Grenze festhalten. Falls das Komponenten-Event abweicht, den UI-Listener an das dokumentierte Event anpassen; falls ein konkurrierender Settings-Write existiert, eine eindeutige Ownership der Einstellung sicherstellen. Keine neue parallele Persistenz einführen. Alternative, pauschal einen zusätzlichen Listener und `setSettings` im Inspector anzuhängen, würde doppelte Writes und Rennen riskieren.
2. **Persistenz über `selectPresentation` und `QuotaAction` beibehalten.** Gültige IDs werden ausschließlich aus dem registrierten Katalog akzeptiert; Action-Settings werden auf Basis des aktuellen `getSettings()` zusammengeführt und pro Kontext serialisiert. Nach erfolgreichem Write aktualisiert die Action die sichtbare Taste aus dem gemeinsamen Servicezustand. Falls die Reproduktion ein Problem in dieser Pipeline zeigt, die kleinste betroffene Stelle dort ändern, statt Renderer und Katalog umzubauen. Alternative, auf einen SDK-Echo-Event zu warten, ist nicht zuverlässig, weil plugininitiierte Writes laut bestehender Implementierung nicht zurückgemeldet werden.
3. **UI-Zustand gegen asynchrone Antworten absichern.** Die angezeigte Auswahl bleibt während eines ausstehenden Writes erhalten; verspätete Settings-/Katalogantworten dürfen sie nicht zurücksetzen. Bei fehlgeschlagenem Write wird der Zustand aus bestätigten Settings wiederhergestellt, statt eine nicht gespeicherte Auswahl als erfolgreich darzustellen. Alternative, nur optimistisch umzuschalten, würde den gemeldeten Persistenzfehler verschleiern.

## Risks / Trade-offs

- [Der Fehler tritt nur im echten SDPI-/Stream-Deck-Laufzeitkontext auf] → Komponenten-Event und Settings-Payload in den Developer Tools verifizieren; zusätzlich reproduzierbare UI-/Action-Tests ergänzen. Sind die Tools nicht offen, Nutzer zum Öffnen bitten.
- [Asynchrone Auswahl- und Settings-Events laufen in anderer Reihenfolge als im Test] → schnelle Wechsel und Wiederöffnung auf derselben Taste sowie unabhängige zweite Taste prüfen.
- [Settings-Merges verlieren Name, Verbindung oder fremde Felder] → Tests mit bereits gespeicherten Feldern und unbekannter Presentation-ID ergänzen; weder Geheimnisse loggen noch als Action-Settings duplizieren.

## Migration Plan

Kein Datenumbau: Bestehende `presentation`-IDs und der Text-Fallback bleiben erhalten. Zur Aktivierung bei der Implementierung `npm run watch` im Verzeichnis `omniroute` ausführen und Plugin-Neuladen prüfen; bei Rücknahme kann die vorherige Plugin-Version mit unveränderten Action-Settings weiterlaufen.
