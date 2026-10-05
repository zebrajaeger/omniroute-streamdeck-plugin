# OmniRoute Stream Deck Plugin

## Logging

Plugin-eigene Diagnosemeldungen verwenden den zentralen Pino-Logger aus `src/logging.ts`. Logs werden als JSON auf der Prozessausgabe ausgegeben. Die SDK-Logging-Ebene bleibt separat.

Die Log-Schwelle kann vor dem Start des Plugins mit `OMNIROUTE_LOG_LEVEL` gesetzt werden. Unterstützte Werte sind `fatal`, `error`, `warn`, `info`, `debug` und `trace`. Fehlt die Variable oder enthält sie einen ungültigen Wert, verwendet der Logger `info`.

Sensible strukturierte Felder wie `password`, `token`, `accessToken`, `refreshToken`, `apiKey` und `authorization` werden auch in verschachtelten Objekten redigiert. Geheimnisse dürfen trotzdem nicht in Freitext-Nachrichten oder anderen Feldern protokolliert werden.

## Build und Runtime-Abhängigkeiten

`npm run build` baut das Plugin und kopiert seine Produktionsabhängigkeiten in `de.lars-brandt.omniroute.sdPlugin/node_modules`, damit die Node-Runtime des Stream Decks sie beim Start auflösen kann.

## Tests

`npm test` führt die Plugin-Tests aus.

## Quota-Tasten

Jede Taste wählt genau eine Provider-Verbindung. Im Property Inspector kann unter „Presentation“ zwischen „Text“ (Standard auch für bestehende Tasten) und „Double ring“ gewählt werden. Die Wahl wird pro Taste im Action-Setting `presentation` gespeichert; unbekannte gespeicherte IDs zeigen Text, ohne das Setting automatisch zu ändern.

Das Feld „Display name“ zeigt ohne Override den Providernamen der ausgewählten Verbindung, sobald Discovery-Daten verfügbar sind. Dieser automatische Name wird **nicht** gespeichert. Ein eigener Name wird als `displayName` pro Taste gespeichert und gilt in beiden Ansichten. Leeren bzw. nur Leerzeichen eingeben setzt den Namen auf den automatischen Providernamen zurück. Ein Verbindungswechsel ändert nur den automatischen Namen, nicht den eigenen.

Im Doppelring ist das lexikografisch erste Quota-Fenster außen und das zweite innen; bei `session`/`weekly` sind dies außen Session und innen Woche. Die farbigen Bögen zeigen verbleibende Prozent, daneben stehen Label und Wert; `∞` und `?` sind keine numerischen Fortschrittswerte. Ein Footer zeigt veraltete Daten/Fehler und weitere Fenster (`+N`). Die Textansicht bleibt ohne eigenen Namen unverändert.

Weitere feste Ansichten: eine reine Funktion `QuotaRenderModel -> SVG` in `src/quota-display/` ergänzen und mit stabiler ID und Label in `src/quota-display/catalog.ts` registrieren. Der Katalog speist sowohl den Dispatcher als auch die Inspector-Optionen. Kein neuer Action-Branch oder zusätzlicher Quota-Request ist nötig.
