## Why

Nach zentraler Datenabfrage und eindeutiger Provider-Auswahl fehlt die eigentliche Anzeige auf dem Stream Deck. Eine kompakte Darstellung soll verbleibende Quotas sowie Fehler- und Veraltet-Zustände sichtbar machen, ohne mehrere Accounts zu vermischen.

## What Changes

- Die Quota-Action mit dem zentralen Cache verbinden und nach gespeicherter `connectionId` rendern.
- Provider/Plan und bis zu zwei dynamisch ermittelte Quota-Fenster als verbleibende Prozentwerte in einer kombinierten 72×72-Darstellung anzeigen.
- Unbekannt, unbegrenzt, erschöpft, fehlende Konfiguration/Verbindung, Authentifizierungsfehler und nicht erreichbares OmniRoute explizit unterscheiden.
- Letzte erfolgreiche Werte bei vorübergehenden Fehlern ausschließlich mit Veraltet-Markierung anzeigen.
- Platzhalter-Vorgabe entfernen und Manifest-Tooltip an die tatsächliche Funktion anpassen.
- Keine zyklische Anzeige, Reset-Countdowns, Balken, Schwellwert-Konfiguration oder Quota-Fenster-Auswahl in diesem ersten Anzeige-Change.

## Capabilities

### New Capabilities
- `quota-key-display`: Providerunabhängige Quota-Anzeige und sichtbare Betriebszustände je Taste.

### Modified Capabilities
- `quota-placeholder`: Die Inertheitsanforderung entfernen; Platzierbarkeit und Action-Identität bleiben erhalten.

## Impact

- Voraussetzungen: `central-quota-service` und danach `quota-provider-selection` implementiert.
- Betroffen: `src/actions/quota.ts`, neues Renderer-Modul, `src/plugin.ts`-Verdrahtung und Quota-Metadaten im Manifest.
- Existierende Action-UUID und gespeicherte `connectionId` bleiben unverändert; keine Requests pro Taste.
- Verifikation am echten Stream Deck mit geöffneten Developer Tools und `npm run watch` erforderlich.
- Provider-Token-Fehler werden erst separat dargestellt, wenn ein dokumentiertes maschinenlesbares Feld dafür vorliegt; generische Fehler dürfen nicht als Token-Fehler geraten werden.
