## Context

Siehe `proposal.md`. Dieser Change setzt den implementierten `central-quota-service` voraus. Heute enthält `src/actions/quota.ts` nur einen Lifecycle-Log; `ui/quota.html` verwaltet ausschließlich den globalen Verbindungsdialog. Der bestehende Dialog schreibt globale Settings direkt über SDPI und bleibt unverändert. Die Haupt-Spec `quota-placeholder` verbietet bisher Action-Settings; ihr Delta erlaubt in diesem Zwischenschritt eine Zuordnung ohne Quota-Anzeige.

## Goals / Non-Goals

**Goals:** Stabile Identität über SDK-Settings, bereinigte Discovery-Metadaten und eine Inspector-Integration ohne Browserzugriff auf OmniRoute.

**Non-Goals:** Quota-Rendering, zusätzliche Formularfelder, zusätzliche Provider-Zugangsdaten, regelmäßiges Discovery-Polling oder Anzeigenamen-Overrides.

## Decisions

1. **Bestehenden Client erweitern, Registry separat halten.** `src/omniroute-client.ts` erhält Discovery; `src/provider-registry.ts` normalisiert verfügbare Connections. Gemeinsame Authentifizierung, Timeout und Generationen aus dem Vorgänger verwenden. Registry hält eine Liste für die aktuelle Konfiguration, coalesced laufende Requests und lädt beim Öffnen/Reload neu. Alternative Discovery direkt im Inspector verlangt Credentials im Browser und wird verworfen.
2. **Antwort-Envelope am Rand isolieren.** Der Konzept-Ausschnitt belegt `connectionId`, `provider`, `name`, nicht die umgebende Collection. Genau diese Collection im Apply gezielt mit einer bereinigten Live-Fixture aus `/api/usage/quota` bestätigen und den Extraktor fixture-basiert testen; keine heuristische rekursive Suche und keine geratenen zusätzlichen Endpoints. Fehlende/duplizierte IDs oder ungültige Collection ergeben `invalid-response`. Provider ohne Namen bleiben auswählbar. Der äußere Envelope ändert weder UI-Vertrag noch Registry-Schnittstelle oder Tasks; Änderungen der fachlichen Felder erfordern Spec-Abgleich.
3. **Bereinigter Nachrichtenvertrag.** `QuotaAction.onSendToPlugin` verarbeitet `loadProviderConnections` samt Request-ID; Antwort `providerConnectionsLoaded` enthält Request-ID, Zustand und ausschließlich `{connectionId, provider, name?}`. SDK-Kontext und Inspector-Lifecycle gegen verspätete Antworten absichern; alte Request-IDs und alte Konfigurationsgenerationen ignorieren. Keine Settings oder rohe API-Antwort mitschicken. Inspector-Neuöffnung bekommt eigene Request-ID.
4. **Offizielle Auswahl, explizite Settings.** `sdpi-select` mit Optionswerten `connectionId` und Reload über `sdpi-button` verwenden. Labels als Text behandeln, nicht via unescaped HTML; Name/Provider plus ID ausreichend disambiguieren. Selektionswechsel liest aktuelle Action-Settings und schreibt Merge mit `connectionId`; leere Auswahl entfernt nur dieses Feld. Nicht zusätzlich automatisch auf den ersten Listeneintrag setzen. Alternative Label als gespeicherter Wert ist instabil.
5. **Fehler ersetzen nicht Zuordnungen.** Laden/Fehler sperrt nur neue Auswahl, nicht Verbindungsdialog oder Reload. Erfolgreich fehlende gespeicherte ID als nicht verfügbare Option darstellen und explizites Löschen erlauben. Beim globalen Settings-Wechsel offene Inspector-Discovery erneuern; die alte Zuordnung bleibt erhalten, bis Nutzer sie ändert.
6. **Abhängigkeiten sequenziell abschließen.** Zuerst Service implementieren/prüfen, dann diesen Change implementieren und seinen Platzhalter-Delta synchronisieren/archivieren, bevor `quota-key-display` abgeschlossen wird. Andernfalls würde spätere Archivierung dieses Changes die entfernte Inertheitsanforderung wieder einsetzen. Eine bereits im Manifest vorhandene separate Connection-Action widerspricht dem inzwischen freigegebenen Ziel; deren unabhängige Bereinigung gehört nicht in diesen Change.

## Risks / Trade-offs

- [Discovery-Antwort enthält möglicherweise sensible Provider-Daten] → Nur erlaubte Metadaten extrahieren, bereinigte Test-Fixtures ohne Tokens/echte E-Mail-Adressen speichern.
- [Inspector-Antwort kommt nach Navigation oder Settings-Wechsel] → Request-ID und Generation prüfen; keine Antwort in einen neuen Action-Kontext schreiben.
- [Accounts haben identische Labels] → Eindeutigkeit über ID gewährleisten, nicht über Provider/Plan.
- [SDK/SDPI-Komponenten laufen außerhalb normaler Node-Tests] → Zustands- und Nachrichtenlogik isolieren, zusätzlich echte Inspector-Interaktion testen.

## Migration Plan

Keine Migration vorhandener Tasten: ohne `connectionId` bleiben sie unzugeordnet. Beide Vorgänger-Verbindungsfelder behalten Format und Bedeutung. Tests/Build ausführen, Developer Tools öffnen lassen und mit `npm run watch` zwei Tasten getrennt konfigurieren, neu öffnen und leere/fehlende Verbindungen prüfen. Rollback entfernt die Auswahloberfläche und Registry; gespeicherte IDs können für spätere Wiederaufnahme erhalten bleiben.
