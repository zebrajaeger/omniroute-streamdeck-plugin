## Why

Das Plugin hat bislang kein einheitliches Logging für eigene Abläufe, wodurch Diagnoseinformationen nicht strukturiert und konsistent erfasst werden können. Pino soll dafür einen zentralen, performanten Logger bereitstellen, ohne den separaten Stream-Deck-SDK-Logger zu ersetzen.

## What Changes

- Ergänzt Pino als Plugin-eigenes Logging-Framework und eine zentrale Logger-Schnittstelle für Plugin-Code.
- Schreibt strukturierte Logs standardmäßig auf die Prozessausgabe und bietet eine konfigurierbare Log-Level-Schwelle mit einem sicheren Standard.
- Begrenzt protokollierte Inhalte auf Diagnoseinformationen und vermeidet Zugangsdaten sowie andere sensible Werte.
- Behält den Stream-Deck-SDK-Logger als separate Komponente bei und überprüft dessen aktuell explizit aktivierten `trace`-Level, damit sensible SDK-Nachrichten nicht unbeabsichtigt protokolliert werden.

## Capabilities

### New Capabilities
- `plugin-logging`: Beschreibt die Anforderungen an strukturiertes Logging für Plugin-eigene Abläufe und den sicheren Umgang mit Log-Leveln und sensiblen Daten.

### Modified Capabilities
- Keine.

## Impact

- Betrifft den Einstiegspunkt `omniroute/src/plugin.ts` und neu zu loggenden Plugin-Code unter `omniroute/src/`.
- Ergänzt Pino als Runtime-Abhängigkeit in `omniroute/package.json` und berücksichtigt die bestehende Rollup-Bündelung.
- Der Stream-Deck-SDK-Logger bleibt separat; seine aktuelle Level-Konfiguration wird hinsichtlich sicherer Standardausgabe angepasst oder begründet beibehalten.
- Keine Änderung an Stream-Deck-Actions oder deren extern sichtbarem Verhalten.
