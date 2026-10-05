## Why

Die konzentrischen Ringe der Double-Ring-Ansicht sind derzeit auf den oberen Teil der 72×72-Taste beschränkt, weil darunter die Prozentwerte als Text stehen. Die Ringe sollen die verfügbare Tastenfläche besser ausnutzen; die untere Prozentzeile ist dafür entbehrlich.

## What Changes

- Die Double-Ring-Ansicht vergrößert beide Ringe auf nahezu die gesamte Tastenfläche, ohne sie am Rand abzuschneiden.
- Die untere Zeile mit Fensterkürzeln und Prozentwerten (insbesondere `S 84%` / `W 76%`) entfällt ausschließlich in dieser Ansicht; die Ringfüllung visualisiert weiterhin die verbleibenden Werte.
- Fenster bleiben anhand ihrer Position (außen/innen) und einer knappen, nichtnumerischen Kennzeichnung unterscheidbar; Name und optionaler Plan bleiben zentral sichtbar, Warn-/Fehlerzustände und Überlaufhinweis bleiben lesbar.
- Die Textansicht und die zugrunde liegende Quota-Berechnung ändern sich nicht.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `quota-key-display`: Anforderungen an die Double-Ring-Darstellung und deren Ausnahme von der allgemeinen Pflicht, Prozentwerte als Text anzuzeigen.

## Impact

- Betroffen: `omniroute/src/quota-display/double-ring.ts`, dessen SVG-Renderer-Tests in `omniroute/src/quota-renderer.test.ts` und die Double-Ring-Integrationstests in `omniroute/src/actions/quota-display.test.ts`.
- Die unveränderte SVG-Ausgabegröße bleibt 72×72; kein neues Setting, keine Änderung an Datenabruf, Persistenz oder Textansicht.
- GitNexus stuft `doubleRingSvg` upstream als **CRITICAL** ein (11 betroffene Knoten, fünf Ausführungsprozesse), da die Darstellung über `quotaImage` in sichtbare Tasten-Updates einfließt. Status-, Stale- und Präsentationswechsel sind daher explizit mitzuprüfen.
