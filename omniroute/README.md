# OmniRoute Stream Deck Plugin

## Logging

Plugin-eigene Diagnosemeldungen verwenden den zentralen Pino-Logger aus `src/logging.ts`. Logs werden als JSON auf der Prozessausgabe ausgegeben. Die SDK-Logging-Ebene bleibt separat.

Die Log-Schwelle kann vor dem Start des Plugins mit `OMNIROUTE_LOG_LEVEL` gesetzt werden. Unterstützte Werte sind `fatal`, `error`, `warn`, `info`, `debug` und `trace`. Fehlt die Variable oder enthält sie einen ungültigen Wert, verwendet der Logger `info`.

Sensible strukturierte Felder wie `password`, `token`, `accessToken`, `refreshToken`, `apiKey` und `authorization` werden auch in verschachtelten Objekten redigiert. Geheimnisse dürfen trotzdem nicht in Freitext-Nachrichten oder anderen Feldern protokolliert werden.

## Build und Runtime-Abhängigkeiten

`npm run build` baut das Plugin und kopiert seine Produktionsabhängigkeiten in `de.lars-brandt.omniroute.sdPlugin/node_modules`, damit die Node-Runtime des Stream Decks sie beim Start auflösen kann.

## Tests

`npm test` führt die isolierten Logging-Tests aus.
