## Why

Mehrere Accounts desselben Providers müssen getrennt konfigurierbar sein. Die vorhandene Quota-Property-Inspector-Seite enthält bisher nur den Zugang zum Verbindungsdialog und bietet keine Zuordnung einer Taste zu einer `connectionId`.

## What Changes

- Verfügbare Provider-Verbindungen über `GET /api/usage/quota` aus derselben global konfigurierten OmniRoute-Instanz entdecken.
- ProviderRegistry und eine Auswahl mit offiziellen SDPI-Komponenten in `ui/quota.html` ergänzen; Accountname, Provider und `connectionId` unterscheiden gleiche Provider eindeutig.
- Pro Taste ausschließlich die ausgewählte `connectionId` speichern; globale URL und API-Key weder kopieren noch an Discovery-Antworten anhängen.
- Laden, leere Listen, Discovery-Fehler und inzwischen fehlende Verbindungen im Inspector anzeigen, ohne die gespeicherte Zuordnung stillschweigend zu ersetzen.
- Die bestehende Platzhalter-Vorgabe so ändern, dass eine konfigurierte Taste zulässig ist, aber noch keine Quota-Werte dargestellt werden.
- Quota-Fenster-Auswahl, Anzeigenamen-Overrides und Display-Modi bleiben außerhalb dieses Changes.

## Capabilities

### New Capabilities
- `quota-provider-selection`: Discovery, eindeutige Auswahl und persistente Zuordnung pro Quota-Taste.

### Modified Capabilities
- `quota-placeholder`: Action-spezifische `connectionId`-Settings erlauben, die Quota-Darstellung weiterhin zurückstellen.

## Impact

- Voraussetzung: `central-quota-service` implementiert; dessen Client und globale Konfigurationsbehandlung werden wiederverwendet.
- Betroffen: `src/actions/quota.ts`, `ui/quota.html`, neue ProviderRegistry sowie Client-Erweiterung für den Discovery-Endpoint.
- Bestehender Verbindungsdialog bleibt unverändert, insbesondere seine zwei Textfelder und explizites Save/Cancel.
- Kein API-Key in Action-Settings, Auswahlbeschriftungen, Discovery-Nachrichten oder Logs.
- Die Antwortform von `/api/usage/quota` ist im Konzept nur ausschnittsweise dokumentiert; eine bereinigte Live-Fixture ist vor Festlegung des Discovery-Parsers erforderlich.
