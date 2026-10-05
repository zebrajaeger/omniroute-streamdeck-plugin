## Why

Die bisherige Textanzeige vermittelt Session- und Wochenquota nur als Zahlen. Zwei konzentrische Fortschrittsringe sollen beide verbleibenden Quotas einer Provider-Verbindung auf einer Taste unmittelbar erfassbar machen, ohne die vorhandene Ansicht abzulösen.

## What Changes

- Pro Quota-Taste wählbare Darstellung: bisherige Textansicht und neue Doppelringansicht; bestehende Tasten bleiben in der Textansicht.
- Session außen, Woche innen; Ringfüllung steht für verbleibende Quota. Zahlen und Zuordnung bleiben lesbar.
- Ein eigenes Namensfeld pro Taste, mit dem bisher dargestellten Providernamen als automatischem Ausgangswert. Ein eigener Name ersetzt den Providerbezeichner in beiden Ansichten; beim Doppelring steht er mittig.
- Gemeinsames darstellungsunabhängiges Modell und erweiterbarer Darstellungskatalog mit stabilen IDs, damit weitere Renderer ohne eigene Quota-Abfrage oder Änderung der Action-Lebenszykluslogik ergänzt werden können.
- Weiterhin genau eine Provider-Verbindung pro Taste. Status-, Fehler-, Stale- und Overflow-Anzeigen bleiben erhalten; beliebige Quota-Fenster werden weiterhin unterstützt.

## Capabilities

### New Capabilities

Keine; die Ergänzung gehört zur bestehenden Tastenanzeige.

### Modified Capabilities

- `quota-key-display`: Wählbare Ansichten, Doppelringvisualisierung, individueller Anzeigename und kompatible Erweiterbarkeit der Darstellungen.

## Impact

- `omniroute/src/quota-renderer.ts`: Modellbildung und SVG-Ausgabe werden getrennt; das Modell muss neben Text auch typisierte numerische bzw. unbekannte/unbegrenzte Werte behalten.
- `omniroute/src/actions/quota.ts`: Darstellungs- und Namenseinstellungen an den Renderer übergeben; sichere actionbezogene Settings-Updates ergänzen.
- `omniroute/de.lars-brandt.omniroute.sdPlugin/ui/quota.html` und Inspector-Skripte: offizielle SDPI-Komponenten für Ansicht und Namen; bestehende Verbindungsauswahl und Modal unverändert erhalten.
- Renderer-, Action- und Inspector-Tests sowie Bedienungsdokumentation erweitern.
- Keine Änderung an OmniRoute-API, gemeinsamem Polling, Zugangsdatenverwaltung oder Plugin-Action-UUID; keine neue Chart-Bibliothek erforderlich.
