## Why

Die funktionierende OmniRoute-Verbindung ist bereits pluginweit konfiguriert, wird aber noch nicht zur Quota-Abfrage genutzt. Als Grundlage für mehrere Provider-Tasten braucht das Plugin eine einzige, providerunabhängige Datenquelle gemäß `konzept.md`.

## What Changes

- Vorhandene globale Settings `url` und `apiKey` für authentifizierte Abfragen von `GET /api/usage/om-usage?format=json` verwenden.
- Einen zentralen QuotaService mit sofortiger Erstabfrage, 20-Sekunden-Polling und Cache nach `connectionId` bereitstellen.
- Generische Quota-Fenster, verbleibende Prozentwerte und explizite Lade-, Fehler- und Veraltet-Zustände normalisieren.
- Änderungen der globalen Verbindung sofort übernehmen, alte Requests entwerten und instanzfremde Daten verwerfen.
- Keine Provider-Auswahl oder Tastenanzeige implementieren; diese folgen in `quota-provider-selection` und `quota-key-display`.
- Kein Verbindungstest im Einstellungsformular, keine direkte Kommunikation mit Provider-APIs und keine Konfiguration des Polling-Intervalls in diesem Ausbau.

## Capabilities

### New Capabilities
- `quota-data-service`: Zentrale authentifizierte Snapshot-Abfrage, providerunabhängige Normalisierung, Cache und Fehlerzustände.

### Modified Capabilities
Keine. Die Vorgabe zum unveränderten Speichern beliebiger Verbindungstexte bleibt erhalten; ungültige Laufzeitkonfiguration wird ausschließlich im Dienst behandelt.

## Impact

- Zielprojekt: `omniroute`, insbesondere `src/plugin.ts`, neue Client-/Service-Module unter `src/` und Tests mit `node:test`/`tsx`.
- Bestehende Settings bleiben kompatibel; Node 24 erlaubt `fetch` ohne zusätzliche HTTP-Abhängigkeit.
- Bestehender Pino-Logger darf ausschließlich bereinigte Statusdiagnosen erhalten.
- Reihenfolge: dieser Change → `quota-provider-selection` → `quota-key-display`.
- Die vom Nutzer bestätigte Verbindung wird nicht während der Planung abgefragt; API-Vertrag basiert auf `konzept.md`, nicht auf einer hier verifizierten Live-Antwort.
