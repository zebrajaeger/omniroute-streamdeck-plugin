## Context

Siehe `proposal.md` für Motivation. `src/plugin.ts` registriert Actions und verbindet das SDK; `src/actions/quota.ts` loggt lediglich `onWillAppear`. `ui/quota.html` liest und schreibt globale `url`/`apiKey` direkt über SDPI. Ein zusätzlich registrierter `ConnectionSettingsAction` verwendet dieselben Settings. `src/logging.ts` stellt Pino mit Feldredaktion bereit. Tests verwenden `node:test`, `tsx` und Assertions; Node 24 ist im Manifest hinterlegt.

`konzept.md` dokumentiert den Snapshot-Envelope `providers`, nicht jedoch sämtliche realen Fehlerantworten. Die vorhandene Spezifikation `connection-settings` verbietet Validierung beim Speichern; Laufzeitfehler dürfen diese UI-Regel nicht verändern. GitNexus liefert für QuotaAction den Einstieg `plugin.ts`, aber keine Ausführungsprozesse; SDK-Lifecycle-Aufrufe sind deshalb zusätzlich anhand des SDK-Vertrags zu prüfen.

## Goals / Non-Goals

**Goals:** Eine SDK-unabhängig testbare Datenpipeline mit einer einzigen Konfigurationsgeneration, deterministischer Normalisierung und atomarem Snapshot-Austausch.

**Non-Goals:** Änderung der Einstellungsoberfläche, Discovery, Rendering, persistenter Quota-Cache oder zusätzliche globale Settings. Keine Behauptung, OmniRoute aktualisiere externe Provider im selben Intervall.

## Decisions

1. **Client und Dienst trennen.** Neue Module `src/omniroute-client.ts`, `src/quota-model.ts` und `src/quota-service.ts`: Client kapselt HTTP, Modell kapselt Parsing/Normalisierung, Dienst kapselt Polling und Veröffentlichung. `fetch`, Uhr und Scheduling injizieren, statt Tests von Stream Deck oder echter Zeit abhängig zu machen. Alternative HTTP pro Action erzeugt doppelte Requests und wird verworfen.
2. **URL als Instanzbasis.** Nur HTTP(S), ohne eingebettete Benutzerinformationen, Query oder Fragment; optionalen Basispfad erhalten, genau einen Slash zum relativen `api/usage/om-usage` ergänzen und `format=json` setzen. Ungültige Werte nur im Dienst zurückweisen, gespeicherte Texte nie verändern. Redirects nicht automatisch verfolgen, um Authentifizierung nicht an unerwartete Ziele zu senden. Alternative blindes String-Anhängen bzw. absolute Pfade verliert Basispfade oder erlaubt unkontrollierte Ziele.
3. **Ein Singleton im Plugin-Bootstrap.** Globale Settings nach SDK-Verbindungsaufbau lesen und SDK-Settings-Änderungen abonnieren. Listener vor Initiallesen registrieren und gegen überholte Initialwerte absichern. URL/API-Key-Tupel vergleichen; Generation bei Änderungen erhöhen, Abort auslösen, Cache löschen, neu starten. Late Results müssen zusätzlich die Generation prüfen. Keine Kopplung an den Save-Handler, da der Quota-Inspector direkt globale Settings schreibt.
4. **Single-flight und feste Wiederholung.** Sofort laden, Request nach 10 Sekunden abbrechen, anschließend einen einzelnen Timer für 20 Sekunden setzen. Manueller `refresh()` teilt eine laufende Promise; `stop()`/Dispose entfernt Timer und verhindert spätere Veröffentlichungen. Alternative `setInterval` lässt Requests überlappen. Polling läuft pluginweit, auch ohne sichtbare Taste; spätere Bedarfsteuerung ist separat.
5. **Expliziter Zustandsvertrag.** `getState()`, `get(connectionId)`, `subscribe(listener)` mit initialem Zustand und Unsubscribe-Funktion anbieten. Zustand enthält Status, bereinigte Fehlerkategorie, `lastSuccessAt`, `stale` und einen nicht mutierbaren Snapshot. Subscriber-Ausnahmen dürfen die Datenpipeline nicht stoppen. Ohne Daten bleibt ein Fehler ein Fehler; mit Daten derselben Generation wird zusätzlich `stale=true` gesetzt.
6. **Strikter Envelope, tolerante optionale Felder.** `providers` muss ein Array eindeutig identifizierter Records mit gültigem Provider sein; Duplikate/fehlende IDs sind ungültige Antwort. Fehlende Quotas werden als leere Map behandelt; ungültige optionale Felder sind unbekannt. Generische Fenster behalten valide Werte für `used`, `total`, `remaining`, `remainingPercentage`, `resetAt`, `unlimited`, `windowSeconds`. Für Prozentwerte gilt die Spec-Priorität; fehlende Bezugsgröße ist nicht Prozent. Numerische Strings werden nicht stillschweigend konvertiert.
7. **Sichere Fehlergrenze.** Nur Kategorien und gegebenenfalls HTTP-Status loggen, niemals rohe Fetch-Errors, Settings, URLs oder Antwortbodies. Pino-Redaktion ist zusätzliche Sicherung und schützt nicht beliebigen Freitext. Keine Provider-Token-Diagnose aus HTTP-Status der OmniRoute-API ableiten.

## Risks / Trade-offs

- [Realer API-Vertrag kann vom Konzept abweichen] → Beim Apply bereinigte Live-Fixture gezielt gegen `providers` und Quota-Felder prüfen; bei Abweichung Vertrag vor Parser-Anpassung abgleichen, nicht geraten implementieren.
- [SDK-Startup und Settings-Events sind asynchron] → Generationen und Tests für Initiallesen/Settings-Wechsel; keine alte Antwort als aktuell publizieren.
- [20 Sekunden nach Abschluss ist kein exakter Wallclock-Takt] → Verhindert Überlast und Überlappung; für Snapshot-Anzeige angemessen.
- [HTTP ist lokal zulässig, aber nicht verschlüsselt] → Keine stille HTTPS-Erzwingung gegenüber bestehenden Settings; Credentials trotzdem nicht protokollieren.

## Migration Plan

Bestehende `url`/`apiKey` unverändert übernehmen, keine Datenmigration. Nach Tests und Build mit geöffneten Stream Deck Developer Tools und laufendem `npm run watch` die Erstabfrage und einen Settings-Wechsel prüfen. Ohne geöffnete Tools Nutzer um Öffnen bitten. Bei Rollback nur Dienstverdrahtung entfernen; die globale Verbindung und Platzhalter-Tasten bleiben erhalten. Kein Commit oder Push ohne gesonderten Auftrag.
