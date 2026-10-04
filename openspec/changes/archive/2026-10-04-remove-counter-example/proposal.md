## Why

Das Plugin enthält noch die von der Stream-Deck-Vorlage stammende Counter-Demo, obwohl sie keine OmniRoute-Funktionalität darstellt. Sie soll entfernt werden, damit das Repository einen neutralen, start- und baubaren Plugin-Rumpf als Ausgangspunkt für die eigentlichen Funktionen enthält.

## What Changes

- Entfernt die Counter-Action samt Registrierung, Property Inspector und ausschließlich dafür verwendeten Grafiken.
- Lässt das Plugin mit gültigen Metadaten und einem verbundenen Einstiegspunkt bestehen, aber ohne Beispiel-Action im Stream Deck.
- Behält allgemeine Plugin-Icons, Build-Konfiguration, Abhängigkeiten und die vorhandene Plugin-Identität bei.

## Capabilities

### New Capabilities
- `plugin-skeleton`: Beschreibt den neutralen, start- und baubaren Plugin-Rumpf ohne mitgelieferte Demo-Actions.

### Modified Capabilities
- Keine.

## Impact

- Betrifft `omniroute/src/plugin.ts`, die Counter-Implementierung unter `src/actions/`, `de.lars-brandt.omniroute.sdPlugin/manifest.json`, den Counter-Property-Inspector und die Counter-Bilddateien.
- Die installierte Plugin-Identität und allgemeine Plugin-Metadaten bleiben unverändert. Nach der Änderung bietet das Plugin zunächst keine Actions in Stream Deck an.
