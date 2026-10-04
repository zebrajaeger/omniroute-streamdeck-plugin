## Why

Das Plugin erscheint derzeit nicht mit einer verwendbaren Action im Stream Deck, weil die Counter-Demo entfernt wurde und die Action-Liste leer ist. Eine minimale Action namens „Quota“ soll als Key platzierbar sein, bis die eigentliche Quota-Funktion umgesetzt wird.

## What Changes

- Fügt eine im Stream Deck sichtbare Key-Action mit dem Namen „Quota“ hinzu.
- Die Action bleibt ein funktionsloser Platzhalter ohne Counter-Verhalten oder Konfiguration; ihr Platzieren auf einem Key ist möglich.
- Behält die bestehende Plugin-Identität und allgemeine Plugin-Metadaten bei.

## Capabilities

### New Capabilities
- `quota-placeholder`: Beschreibt die sichtbare, platzierbare Quota-Platzhalter-Action.

### Modified Capabilities
- Keine.

## Impact

- Betrifft `omniroute/src/plugin.ts`, `omniroute/de.lars-brandt.omniroute.sdPlugin/manifest.json` und gegebenenfalls neue Action-spezifische Assets.
- Keine Änderungen an Plugin-UUID, Abhängigkeiten oder der späteren fachlichen Quota-Logik.
