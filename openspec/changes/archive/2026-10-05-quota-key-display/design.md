## Context

Siehe `proposal.md`. Voraussetzungen sind der implementierte zentrale Service und die persistente Provider-Auswahl. Die bestehende Action-UUID `de.lars-brandt.omniroute.quota` und der Property Inspector bleiben bestehen. Derzeit rendert `src/actions/quota.ts` nichts und das Manifest bezeichnet die Action als Platzhalter. Dieser Change entfernt die Inertheitsanforderung erst nach dem Spec-Sync von `quota-provider-selection`.

## Goals / Non-Goals

**Goals:** Ein testbarer Renderer, eindeutig priorisierte Betriebszustände und Lifecycle-sichere Aktualisierung mehrerer sichtbarer Tasten.

**Non-Goals:** Neue Providerlogik, zusätzliche HTTP-Abfragen, Accountnamen aus Discovery als persistente Settings, Animation, Reset-Countdown oder manuell konfigurierte Quota-Fenster.

## Decisions

1. **Rendern von Seiteneffekten trennen.** Neues `src/quota-renderer.ts` erzeugt aus Servicezustand plus `connectionId` ein Render-Modell und daraus escaped SVG als Data-URL. SVG passt zum SDK-`setImage` und erlaubt kontrollierte 72×72-Platzierung; Alternative mehrzeiliger `setTitle` bietet weniger Kontrolle über lange generische Keys und Statusmarkierungen. Provider/Plan oben, zwei Wertezeilen in der Mitte, Status/Overflow unten; größere Geräte skalieren dieselbe Vorlage. Farbe ist unterstützend, nie alleiniger Zustandsträger.
2. **Deterministische Fensterwahl.** Keys per codepoint-basierter lexikografischer Sortierung, nicht localeabhängig sortieren; erste zwei verwenden. Bekannte `session`/`weekly` dürfen als `S`/`W` gekürzt werden, sonst lesbares begrenztes Key-Präfix mit Ellipse. Falls gekürzte Labels kollidieren, unterschiedliche Suffixe vergeben. Werte haben festen Platz und werden nicht abgeschnitten. `+N` kennzeichnet weitere Fenster. Alternative Response-Reihenfolge erzeugt springende Anzeigen; konfigurierbare Auswahl wäre ein eigener Change.
3. **Statuspriorität vor Zahlen.** Keine Action-ID → `Auswählen`; unkonfigurierte/ungültige globale Verbindung → `Verbindung`/`URL ungültig`; ohne Snapshot laden → `Laden`; ohne verwendbare Daten Fehler → `API-Key`, `Offline` oder `Datenfehler`. Nur nach erfolgreichem Snapshot darf fehlende ID `Verbindung fehlt` bedeuten. Ein Provider mit leerer Quota-Map zeigt `Quota ?`. Bei stale Snapshot matching Record weiter darstellen, aber Footer zwingend `Alt` plus Fehlerkürzel; fehlt dieser Record, Fehler statt veralteter fremder Werte anzeigen. Unbegrenzte Werte überschreiben Prozentwerte, Null bleibt Null.
4. **Lifecycle zentral, Update pro sichtbarer Action.** QuotaAction bekommt Service per Konstruktor über `plugin.ts`. Sichtbare Action-Kontexte mit Settings speichern, `onWillAppear`, `onDidReceiveSettings` und `onWillDisappear` bedienen. Eine Service-Subscription verteilt Updates an sichtbare Kontexte; versteckte Kontexte entfernen. Render-Sequenzen pro Action serialisieren oder generationengesichert coalescen, damit ältere asynchrone SDK-Schreibvorgänge keinen neueren Zustand übermalen. Kein Polling-Timer in der Action; Key-Down bekommt keine Refresh-Sonderfunktion.
5. **SDK-Bild und Titel zusammen betrachten.** Bild über `setImage` setzen, Action-Titel für dieses Layout kontrolliert leeren, damit alte SDK-Titel Werte nicht überlagern. Identische Render-Ausgaben nicht erneut senden; Fehler bei einer entfernten Taste isolieren und bereinigt loggen. XML-Labels escapen, keinerlei rohe URLs/Fehlerstrings/Account-Tokens in SVG übernehmen.
6. **Metadaten nur zielbezogen ändern.** Im Manifest nur Quota-Tooltip aktualisieren, UUID, Controller, PropertyInspectorPath und andere Actions nicht nebenbei ändern. Die schon vorhandene separate Connection-Action ist ein beobachteter Widerspruch zur Modal-only-Spec, aber keine Voraussetzung für Quota-Rendering und bleibt einem separaten Abgleich vorbehalten.

## Risks / Trade-offs

- [72×72 bietet wenig Platz] → Bis zu zwei Fenster, kurze eindeutige Labels, feste Wertespalte und Live-Lesbarkeitsprüfung.
- [Sehr alte OmniRoute-interne Snapshots können trotzdem frisch abgerufen sein] → `stale` bedeutet fehlgeschlagene Plugin-Abfrage, nicht garantierte Provider-Aktualität; keine irreführende eigene Frischegarantie.
- [Provider-Token-Fehler sind im Konzept nicht maschinenlesbar spezifiziert] → Nur belegte Servicekategorien anzeigen, keine Token-Diagnose aus leeren Quotas ableiten.
- [Async SDK-Ausgabe nach Profilwechsel] → Sichtbarkeit und Rendergeneration vor Aktualisierung prüfen, Updates je Taste ordnen.

## Migration Plan

Zuerst beide Vorgänger implementieren und ihre Specs synchronisieren/archivieren. Dann Renderer und Action-Verdrahtung bereitstellen, UUID/Settings beibehalten, bestehende unzugeordnete Tasten mit Konfigurationshinweis anzeigen. `npm test`, Typecheck und Build ausführen; mit geöffneten Stream Deck Developer Tools und `npm run watch` mehrere Accounts, Profilwechsel, Fehler und Recovery prüfen. Rollback der Anzeige belässt gespeicherte Zuordnungen und globalen Dienst intakt. Keine Archivierung, kein Commit und kein Push ohne entsprechenden Auftrag.
