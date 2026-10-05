## Context

Siehe `proposal.md` zur Motivation und `specs/quota-key-display/spec.md` zum Vertrag. Die Inspector-Oberfläche verwendet `sdpi-textfield` in `ui/quota.html`; `ui/provider-selector.js` hört für den Namen derzeit ausschließlich auf `change`, verwaltet `customName`/`namePending` und sendet `setDisplayName`. `QuotaAction.onSendToPlugin` serialisiert Settings-Schreibvorgänge pro Action, normalisiert den Namen und rendert sichtbare Tasten nach `setSettings` selbst, da plugininitiierte Schreibvorgänge kein `onDidReceiveSettings` auslösen. `quotaRenderModel` priorisiert einen nichtleeren Anzeigenamen bereits vor `provider.provider`. Die SVG-Renderer in `quota-display/text.ts` und `quota-display/double-ring.ts` zeichnen den Namen bislang als eine Zeile; `shorten` ersetzt Steuerzeichen durch Leerzeichen. Die vorhandenen Unit-Tests simulieren `name:change`, aber nicht die tatsächliche Ereignisfolge der offiziellen Textfeld-Komponente. Die genaue Fehlerursache ist daher noch nicht bewiesen; die Implementierung muss den tatsächlichen Eingabe-/Commit-Pfad verifizieren.

## Goals / Non-Goals

**Goals:**
- Eine explizit bestätigte Namenseingabe zuverlässig vom Textfeld bis zum per-Action gespeicherten `displayName` und zur sichtbaren Taste führen.
- Automatische Vorbelegung und explizite Überschreibung getrennt halten; asynchrone Discovery- und Settings-Antworten dürfen neue Eingaben nicht zurücksetzen.
- Den bestehenden Settings-Merge und Renderpfad beibehalten, soweit er korrekt funktioniert.
- Die wörtliche Escape-Sequenz `\n` im benutzerdefinierten Namen erst für die Darstellung in Zeilen aufteilen; die Textansicht behält ihren Namensbereich, die Double-Ring-Ansicht nutzt das Ringzentrum allein für den Namen.

**Non-Goals:**
- Neue globale Namenskonfiguration, Änderung des Provider-Namens auf dem Server, Quota-Neuladen oder Redesign der Textansicht und der Status-/Überlaufanzeige.
- Umbau der gesamten Präsentations-/Verbindungsauswahl.

## Decisions

1. **Textfeldereignisse am realen Element nachvollziehen und gezielt korrigieren.** Zuerst im Stream Deck Developer Tools Inspector prüfen, welche `input`-/`change`-Ereignisse beim Tippen und beim Verlassen des Felds ausgelöst werden und wann `.value` aktualisiert wird. Die Bindung in `provider-selector.js` wird für die tatsächlich auftretenden Ereignisse ausgelegt; bei Bedarf den neuen Wert aus dem Ereignis-Pfad bzw. dem inneren Textfeld statt aus einem noch veralteten Hostwert lesen. Pro bestätigtem Wert nur einen Speichervorgang auslösen; automatische Vorbelegung darf keinen auslösen. Alternative, das Setting blind bei jedem Discovery-Update zu speichern, wird wegen versehentlicher Overrides verworfen.
2. **Bestehendes per-Action-Protokoll statt neuer Speicherquelle nutzen.** `setDisplayName` bleibt ein Inspector→Plugin-Ereignis. `QuotaAction` liest den aktuellen Settings-Stand und schreibt gemergte Daten mit normalisiertem Namen; leerer Wert entfernt `displayName`. Der sichtbare Key wird nach erfolgreichem Schreiben aus dem vorhandenen gemeinsamen Quota-Zustand neu gezeichnet. Sollte die Reproduktion eine Lücke in diesem Pfad zeigen, nur diese schließen; keine direkte zweite `setSettings`-Schreibquelle im Inspector einführen, da sie mit Präsentations- und Verbindungsänderungen konkurrieren könnte.
3. **Asynchrone Namenseingaben absichern.** Einen während der Bearbeitung bzw. des Speicherns eingegebenen Wert nicht durch verspätete Discovery oder `didReceiveSettings` überschreiben; nach einem fehlgeschlagenen Schreibvorgang den bestätigten Settings-Stand wiederherstellen statt eine nicht gespeicherte Eingabe dauerhaft vorzutäuschen. Vorhandene `namePending`-Logik anhand schneller Folgeeingaben überprüfen und bei Bedarf analog zum Präsentations-Request gezielt bestätigen. Alternative, jeden Settings-Echo ungeprüft zu übernehmen, verliert lokale Eingaben.
4. **Zeilenumbruch nur im Namen rendern.** Die zwei Zeichen `\n` unverändert im Action-Setting speichern und im Renderpfad für benutzerdefinierte Namen in Zeilen aufteilen; nicht das globale `shorten`-Verhalten für Quota-Labels oder andere Texte ändern. Die Zeilen einzeln XML-sicher zeichnen und deterministisch auf die freie Fläche begrenzen. Die Textansicht behält ihre Namens-, Plan- und Quota-Positionen. In der Double-Ring-Ansicht entfallen Plantext und Fensterlegende auch ohne benutzerdefinierten Namen; stattdessen wird der effektive Name (automatisch oder individuell, ein- oder mehrzeilig) um den tatsächlichen Ringmittelpunkt zentriert. Die Ringgeometrie sowie Footer und Fehlermeldungen bleiben erhalten. Alternative, nur den Namen oberhalb der verbliebenen Legende zu verschieben, wird verworfen: sie reproduziert das beobachtete Problem.
5. **Optisches statt bloß mathematisches Zentrieren.** Die SVG-Textreferenzlinie (`dominant-baseline="middle"`) deckt sich je nach Schrift und Rasterung nicht exakt mit der sichtbaren Glyphenmitte. Den Namen in der Double-Ring-Ansicht um einen kleinen, für eine und zwei Zeilen gleichen vertikalen Korrekturwert verschieben; die unveränderten Ringzentren (36 bzw. 32 bei Footer) bleiben Bezugsgröße. Die Textansicht sowie Status-/Footer-Positionen sind davon ausgenommen. Die Korrektur ist mit tatsächlichem SVG-Rendering und einem Regressionstest zur sichtbaren Glyphenmitte zu überprüfen, nicht allein durch Vergleich der SVG-`y`-Attribute.

## Risks / Trade-offs

- [Unterschiedliche Ereignisreihenfolge von `sdpi-textfield` gegenüber Test-Doubles] → In Developer Tools mit laufendem `npm run watch` verifizieren und die beobachtete Ereignisfolge im Inspector-Test abbilden.
- [Doppeltes `input`/`change` oder veraltete Antworten verursachen doppelte bzw. zurückspringende Werte] → Deduplizierung und schnelle Folgeeingaben samt Fehlerpfad testen; Settings nur für explizite Benutzereingaben schreiben.
- [Renderänderungen beschädigen Präsentation oder andere Keys] → Beide Präsentationen, sofortiges Update ohne Settings-Echo und unabhängige Keys gegen vorhandene Renderer-/Action-Tests prüfen.
- [Lange oder viele durch `\n` getrennte Zeilen passen nicht in den Namensbereich] → Zeilen/Zeichen deterministisch und sicher auf die verfügbare Fläche kürzen, ohne die gespeicherte Eingabe zu ändern; Grenzfälle in beiden SVG-Ansichten testen.
- [Ohne Fensterkennzeichnung sind beliebige Fensternamen im Ring nicht direkt ablesbar] → Die äußere/innere Zuordnung und Progression bleiben stabil; die bewusste Reduktion der Information in der Double-Ring-Ansicht wird in der Delta-Spec festgehalten, während die Textansicht die Fensternamen und Werte weiter zeigt. Sonderwerte (`∞`, `?`) bleiben als separate nonnumerische Zustände erkennbar.

## Migration Plan

Keine Datenmigration: bestehende `displayName`-Action-Settings bleiben gültig, fehlende bzw. blanke Werte verwenden weiter den Provider-Namen. Die Korrektur wird mit dem üblichen Plugin-Build und Watch-Reload ausgeliefert; bei Rücknahme bleiben gespeicherte Action-Settings unverändert.
