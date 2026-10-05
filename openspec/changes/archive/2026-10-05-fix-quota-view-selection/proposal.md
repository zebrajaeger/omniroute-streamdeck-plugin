## Why

In der Konfiguration einer Quota-Taste lässt sich die Ansicht zwischen Text und Double ring laut Fehlerbericht nicht wirksam umstellen: Die Auswahl bleibt nicht gespeichert und die Taste ändert sich nicht. Das verletzt die bereits dokumentierte Anforderung an eine pro Taste gespeicherte Darstellung und macht die Ringansicht praktisch unbenutzbar.

## What Changes

- Die Auswahl im Property Inspector wird als Einstellung der betroffenen Quota-Aktion übernommen und beim erneuten Öffnen wieder angezeigt.
- Eine erfolgreiche Auswahl aktualisiert die sichtbare Taste sofort aus dem vorhandenen Quota-Zustand, ohne einen zusätzlichen Netzwerkabruf auszulösen.
- Regressionstests decken den tatsächlichen Weg vom UI-Ereignis über das Speichern bis zur Darstellung und Wiederherstellung ab; vorhandene Verbindungszuordnung, Anzeigename und andere Einstellungen bleiben erhalten.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `quota-key-display`: Die vorhandene Anforderung zur pro Taste gespeicherten Darstellung wird um ein explizites End-to-End-Szenario für den Wechsel zwischen Text und Double ring ergänzt.

## Impact

- Betroffen sind voraussichtlich `omniroute/de.lars-brandt.omniroute.sdPlugin/ui/provider-selector.js`, `omniroute/src/actions/quota.ts` und ihre Tests; die genaue Fehlerursache muss in der Umsetzung anhand des tatsächlichen Stream-Deck-Events bestätigt werden.
- Keine neue externe API, keine Änderung der globalen Zugangsdaten oder des Quota-Pollings vorgesehen.
