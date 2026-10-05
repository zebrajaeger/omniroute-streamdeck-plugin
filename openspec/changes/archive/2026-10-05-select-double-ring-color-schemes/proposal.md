## Why

Die Double-Ring-Ansicht verwendet derzeit immer dieselben zwei Akzentfarben. Unterschiedliche Quota-Tasten lassen sich damit optisch nur schwer auseinanderhalten; zugleich müssen äußerer und innerer Ring innerhalb eines Schemas klar unterscheidbar bleiben.

## What Changes

- Der Property Inspector erhält für die Double-Ring-Ansicht eine Farbschema-Auswahl pro Quota-Taste mit mehreren deutlich unterschiedlichen, fest definierten Schemata.
- Jedes Schema weist Außen- und Innenring unterschiedliche, gut erkennbare Akzentfarben zu; Ringposition und kurze Fensterkennzeichnungen bleiben zusätzliche Unterscheidungsmerkmale.
- Die Auswahl wird in den Action-Settings der jeweiligen Taste gespeichert und aktualisiert das Bild ohne zusätzliche Quota-Abfrage. Bestehende Tasten behalten ohne Auswahl die bisherigen Ringfarben; unbekannte gespeicherte Werte führen zur sicheren Standarddarstellung.
- Textansicht, Quota-Berechnung und Verbindungseinstellungen bleiben unverändert.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `quota-key-display`: Farbschema der Double-Ring-Präsentation pro Taste auswählen, wiederherstellen und kompatibel darstellen.

## Impact

- Betroffen sind der Double-Ring-Renderer und die Weitergabe der Action-Settings über `quotaImage`, der Quota-Property-Inspector (`quota.html`, `provider-selector.js`) sowie Renderer-, Inspector- und Action-Tests.
- Das laufende Change `expand-double-ring-to-full-key` verändert dieselbe Spezifikation und denselben Renderer. Beide Deltas vor Implementierung/Archivierung zusammenführen bzw. gegen den dann aktuellen Stand abgleichen; die Farbschema-Auswahl soll von Ringgeometrie und Prozenttext unabhängig sein.
- GitNexus: `doubleRingSvg` hat upstream **CRITICAL** Risk (11 Knoten, fünf betroffene Prozesse); betroffen sind u. a. `quotaImage` und sichtbare Action-Updates bei Erscheinen, Settings-Änderungen und Shared-State-Änderungen. Entsprechende Regressionstests sind erforderlich.
