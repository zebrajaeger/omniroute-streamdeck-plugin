## Context

Siehe `proposal.md` für Motivation und `specs/quota-key-display/spec.md` für Verhalten. Das Plugin ist TypeScript mit Elgato SDK 3 und erzeugt derzeit ein 72×72-SVG ohne Chart-Bibliothek. `quotaRenderModel` in `omniroute/src/quota-renderer.ts` übernimmt Statusprioritäten, Verbindungsauswahl, Unicode-Codepunkt-Sortierung, Kürzung und Sonderwerte; seine Rows enthalten bislang nur Label und formatierten Text. `quotaSvg` zeichnet ausschließlich die Textansicht, `quotaImage` kodiert das Ergebnis.

`QuotaAction.render` übergibt bisher nur `connectionId`. Die bestehende Schreibwarteschlange serialisiert/coalesziert Bilder, setzt den SDK-Titel leer und verhindert Updates ausgeblendeter Tasten. Diese Logik darf durch einen Ansichtswechsel nicht dupliziert werden. Der Inspector verwendet offizielle SDPI-v4-Komponenten; `provider-selector.js` verarbeitet kontext- und requestgebundene Discovery-Nachrichten. Connection-Settings werden über das Plugin mit `getSettings` und `mergeConnectionId` gespeichert. Der Snapshot enthält Provider und Plan, aber keinen Account-Namen; Discovery liefert bereits sanitisierten Provider und optionalen Account-Namen.

Die bestehenden Specs verlangen ausdrücklich den Provider als Heading und zeilenweise Quotas. Die Delta-Spec modifiziert beide Anforderungen vollständig, statt die neue Ansicht widersprüchlich nur hinzuzufügen. Fehler-, Stale- und Lebenszyklusanforderungen bleiben bestehen. Vorhandene Tests decken Sonderwerte, exakt erzeugte Text-SVGs, sichere XML-Ausgabe, Inspector-Events und langsame SDK-Schreibvorgänge ab.

## Goals / Non-Goals

**Goals:**
- Ein gemeinsames semantisches Modell als einzige Quelle für Werte, Reihenfolge, Namen und Status; Renderer kümmern sich ausschließlich um Geometrie und Styling.
- Ein interner, statischer Darstellungskatalog mit stabiler Settings-ID und reiner Renderfunktion; Auswahloptionen und Dispatch stammen aus derselben Quelle.
- Actionbezogene, verlustfreie Settings-Updates auch bei schnellen Änderungen an Verbindung, Ansicht und Namen.
- Kleine, deterministische SVGs, kompatible Defaults und keine zusätzliche Netzwerkaktivität bei Darstellungsänderungen.

**Non-Goals:**
- Keine dynamisch installierbaren Renderer, Benutzer-Skripte, Animationen, frei konfigurierbaren Farben oder zusätzliche Chart-Ansichten in diesem Change.
- Keine Multi-Provider-Taste, manuelle Fensterzuordnung, Änderung der Daten-Normalisierung oder des gemeinsamen Pollings.
- Keine Übernahme des nativen Stream-Deck-Titels: Der aktuelle sichtbare Name ist Bestandteil des SVGs; `setTitle("")` bleibt bestehen.

## Decisions

### 1. Semantisches Modell und Renderstrategien trennen

`quota-renderer.ts` bleibt der öffentliche Einstieg. Modellbildung, SVG-Helfer und konkrete Text-/Doppelringrenderer werden in klar abgegrenzte Module unter `src/quota-display/` ausgelagert. Das gemeinsame Modell behält pro ausgewähltem Fenster den originalen Schlüssel, das gekürzte eindeutige Label, `QuotaPercentage` und den gerundeten Anzeigetext. Providername, effektiver Name, optionaler Plan, Statusmeldung, Stale-Kategorie und Overflow sind ebenfalls rendererunabhängig.

Ein Katalog führt anfangs `text` und `double-ring`, jeweils mit ID, Inspector-Label und reiner Funktion `model -> SVG`. Ein zentraler Resolver fällt bei fehlenden, ungültigen oder unbekannten IDs auf `text` zurück. Nur ID/Label werden auf eine neue, kontextgebundene Inspector-Metadatenanfrage übertragen; kein ausführbarer Code oder Quota-Rohdaten. Eine dritte Ansicht benötigt nur Renderer und Katalogeintrag, nicht neue Action-Branches oder hardcodierte Inspector-Optionen.

Alternative: ein großer Switch in Action und HTML. Verworfen wegen mehrfach gepflegter Optionen und schlechter Erweiterbarkeit. Eine externe Chart-Library oder Laufzeit-Pluginplattform wäre für zwei statische SVG-Ansichten unnötig.

### 2. Darstellungseinstellungen explizit und kompatibel speichern

Neue actionbezogene Felder: `presentation` mit stabiler ID und optionales `displayName`. Fehlende Settings lösen Text und automatischen Providernamen aus, ohne Massenmigration. Namen werden getrimmt; leere Eingaben entfernen `displayName`. Steuerzeichen werden bei Darstellung neutralisiert, SVG-Text wird XML-escaped; Kürzung erfolgt nach Unicode-Codepunkten und verfügbarem Layout, nicht durch Abschneiden der Prozentwerte. Unbekannte Präsentations-IDs werden nur zur Laufzeit als Text aufgelöst und erst bei expliziter Auswahl ersetzt.

Inspector-Metadaten nutzen den Provider-Namen der zugeordneten Discovery-Verbindung, nicht deren Account-Namen oder zusammengesetztes Auswahl-Label. Dies entspricht dem bisher sichtbaren Heading. Das vorbefüllte Feld ist lediglich der automatische Wert, kein persistierter Override. Bei fehlenden Metadaten bleibt es ohne erfundenen Namen; Hinweise können den automatischen Modus erklären. Eigene Eingaben werden gegen verspätete Discovery-Antworten geschützt. Beim Verbindungswechsel folgt ein automatischer Name der neuen Verbindung, ein gespeicherter Custom-Name bleibt unverändert. Der automatische Name wird pro Layout wie das alte Heading gekürzt; das Feld enthält den ungekürzten Ausgangswert.

Alternative: den vorgefüllten Namen sofort speichern. Verworfen, weil ein alter Providername nach einem Verbindungswechsel unbemerkt bestehen bliebe.

### 3. Gemeinsame Settings-Schreibstrecke für Inspector-Änderungen

Neue Nachrichten aktualisieren Ansicht und Namen über das Plugin, ohne URL/API-Key in Action-Settings zu kopieren. Verbindungsauswahl und neue Felder nutzen dieselbe pro Action serialisierte Read-modify-write-Strecke. Jeder Vorgang liest aktuelle Settings innerhalb dieser Strecke, verändert nur seine eigenen Felder und prüft Inspector-Kontext/Visit vor dem Schreiben. Pending-Zustände im Inspector verhindern, dass verspätete Settings-Events jüngere Eingaben überschreiben. Bestehende Verbindungsmodal-, Discovery- und Invalidation-Pfade bleiben erhalten; zugehörige Tests werden erweitert.

Alternative: SDPI-Autopersistenz der neuen Felder neben den bestehenden Plugin-Schreibvorgängen. Verworfen, weil konkurrierende vollständige Settings-Objekte Verbindung, Namen oder Darstellung verlieren könnten. Offizielle SDPI-Felder werden hier kontrolliert eingebunden.

### 4. Doppelring als deterministisches 72×72-SVG

Beide Ansichten verwenden dieselbe Codepunkt-Sortierung und höchstens zwei Fenster. Damit sind Session außen und Woche innen, ohne einen Codex-Sonderpfad einzuführen. Ein einzelnes Fenster nutzt den Außenring. Neutraler Track und zwei feste kontrastierende Akzentfarben unterscheiden die Ringe; Textlabels `S`/`W` bzw. eindeutige generische Kürzungen ermöglichen Zuordnung ohne Farberkennung.

Startpunkt ist zwölf Uhr, Fortschritt läuft im Uhrzeigersinn. Ringlänge nutzt den ungerundeten normalisierten Wert; gerundet wird nur Text. Zero und 100 werden explizit ohne Restpunkt bzw. Spalt gezeichnet. Unbegrenzt und unbekannt erhalten unterschiedliche nichtnumerische Track-/Linienstile sowie `∞`/`?`, nicht scheinbare 100-/0-Prozentwerte. Status ohne verwendbare Quotas nutzt eine gemeinsame kompakte Statusdarstellung ohne Fortschrittsarcs.

Layout-Ausgangspunkt: Ringe um `(36, 30)` mit Radien ungefähr 26 und 20 und Strichbreite 4; zentraler Name mit deterministischer Kürzung, Plan in einer zweiten kleineren Zentrumzeile; zwei eindeutig zugeordnete Zahlenzeilen im unteren Bereich und reservierte Footerzeile für Stale/Overflow. Konkrete Koordinaten, Schriftgrößen und Farben werden beim realen 72×72-Check angepasst, ohne die Informationspflichten zu reduzieren. Lange Namen verlieren Zeichen, nicht Quota-Werte oder Statusmarker. Gemeinsame SVG-Helfer erzwingen XML-Sicherheit und einheitliche Hülle.

Alternative: Prozentwerte nur durch Ringfüllung vermitteln. Verworfen, weil genaue Werte und unbekannte/unbegrenzte Zustände sonst schwer lesbar oder missverständlich wären.

## Risks / Trade-offs

- [72×72 bietet wenig Platz für zwei Ringe, Namen, Plan und Status] → Kurze eindeutige Fensterlabels, kompakte zentrale Beschriftung, feste Zahlen-/Footerbereiche und Sichtprüfung bei Originalgröße; Name/Plan kürzen, Werte und Warnungen erhalten.
- [Graph-Auflösung ist bei Inspector-JavaScript und SDK-Dispatch begrenzt] → Vor Implementierungsedits GitNexus-Impact nutzen und UNKNOWN/Dispatch-Grenzen mit gezielter Quellsuche sowie Event-Tests absichern; keine Nulltreffer als Sicherheitsbeweis behandeln.
- [Konkurrierende Settings-Änderungen könnten andere Felder überschreiben] → Eine actionbezogene serialisierte Schreibstrecke für alle drei lokalen Einstellungsarten und deterministische Race-Tests.
- [Rendererwechsel während langsamer Bildwrites könnte eine alte Ansicht zurückbringen] → Bestehende Revision-/Pending-Mechanik weiterverwenden und mit Ansichts-/Namenswechseln testen.
- [SVG-Snapshottests fixieren die bisherige Struktur] → Text ohne Custom-Name visuell kompatibel halten; reine Strukturänderungen separat begründen und semantische/geometrische Tests für neue Renderer hinzufügen.
- [Farben allein reichen nicht für Zuordnung und Sonderzustände] → Konstante Reihenfolge, sichtbare Labels/Werte und unterscheidbare Track-Stile.

## Migration Plan

1. Bestehende Action-UUID, `connectionId` und globale Verbindungseinstellungen unverändert lassen; neue optionale Settings ohne automatische Schreibmigration einführen.
2. Tests und Build im Plugin-Unterordner ausführen. Für reale Verifikation Stream Deck Developer Tools öffnen lassen und vorhandenen Watch-Prozess verwenden bzw. `npm run watch` starten, damit das Plugin neu geladen wird.
3. Text-Default für bestehende Tasten, unabhängige Doppelring-Auswahl, Naming, Restart, Stale/Recovery und Originalgrößenlayout prüfen.
4. Bei Problemen kann der Nutzer sofort Text wählen. Ein Rollback auf die bisherige Version ignoriert zusätzliche Settings-Felder; unbekannte IDs bleiben in der neuen Version sicher als Text darstellbar. Ein eigener Name ist in der alten Version nicht sichtbar, bleibt aber als Setting erhalten.
