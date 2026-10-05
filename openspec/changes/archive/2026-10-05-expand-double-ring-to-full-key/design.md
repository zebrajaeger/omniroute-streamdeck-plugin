## Context

Siehe `proposal.md` für die Motivation und `specs/quota-key-display/spec.md` für die sichtbaren Anforderungen. Der Double-Ring-Renderer in `omniroute/src/quota-display/double-ring.ts` verwendet ein 72×72-SVG: Kreismittelpunkt `(36,29)`, Radien `26` und `19`, darunter Werte bei `y=60` sowie einen Footer bei `y=69`. `quotaRenderModel` liefert bereits sortierte Fenster, gekürzte Labels, Prozenttypen, Name, Plan, Status und Footer. Die Textansicht nutzt dasselbe Modell, hat aber einen eigenen Renderer. Die sichtbare Taste bekommt das SVG über den Präsentationskatalog und `quotaImage`.

## Goals / Non-Goals

**Goals:**
- Ringgeometrie und Beschriftung innerhalb der bestehenden 72×72-Fläche neu anordnen; die Ringe im Normalzustand möglichst groß darstellen.
- Zustände und Fenster auch ohne Prozentzeile verständlich halten und bestehende Auswahl-/Aktualisierungswege unverändert lassen.

**Non-Goals:**
- Änderungen am Normalisierungsmodell, der Textpräsentation, der Quota-Abfrage oder den gespeicherten Action-Settings.
- Eine neue Anzeige numerischer Prozentwerte innerhalb oder neben den Ringen.

## Decisions

1. **Nur den Double-Ring-SVG-Renderer ändern.** Kreise um die Tastenmitte zentrieren und den Außenradius anhand von SVG-Rand und Strichbreite bis dicht an die Kante vergrößern; den Innenradius mit ausreichend Abstand für zwei getrennte Tracks wählen. Geometrie für Track, Fortschritt und Rotation gemeinsam verwenden, damit null/voll/gebrochen weiterhin korrekt sind. Alternative: das gesamte SVG per `scale` strecken; verworfen, weil auch Schrift und Abstände verzerrt bzw. abgeschnitten würden.
2. **Numerische Bottom-Labels ausschließlich in Double-Ring entfernen.** Für die Fensterzuordnung kurze nichtnumerische Labels aus den vorhandenen Modell-Labels in einer kleinen Legende innerhalb der Kreisfläche, getrennt nach außen/innen (z. B. `S`/`W`), unterbringen; Farbunterscheidung bleibt zusätzlich erhalten. Optionalen Namen/Plan zentral so begrenzen, dass sie nicht mit Legende oder Ringen kollidieren. Keine Änderung an `rows.value` im Modell, weil die Textansicht sie weiterhin braucht. Alternative: Wertetext in die Ringmitte verlegen; verworfen, weil dies den gewonnenen Platz verbraucht und dem gewünschten Wegfall widerspricht.
3. **Status und Footer als Ausnahmen behandeln.** Bei fehlenden Quotas weiterhin nur expliziten Status ohne Kreise ausgeben. Bei stale/Overflow den vorhandenen Footer lesbar im unteren Bereich halten, notfalls eine kleine Innenfläche bzw. eine zurückhaltende Hintergrundfläche für den Hinweis reservieren; er darf nicht durch den vergrößerten unteren Ringbogen verschwinden. Die Kreisfläche im Normalzustand nicht dauerhaft um eine breite Footer-Zeile verkleinern. Unbegrenzte und unbekannte Quotas behalten ihre eigenen Strichmuster; eine kleine nichtnumerische Zustandsmarkierung (`∞`/`?`) ist bei solchen Fenstern zulässig. Alternative: Footer auf Stream-Deck-Titel auslagern; verworfen, da der Titel aktuell bewusst leer gesetzt wird und die Darstellung im Bild bleiben soll.

## Risks / Trade-offs

- [Große Ringe kollidieren mit SVG-Rand, Footer oder Text] → Strichstärke bei der Radiuswahl einrechnen, Positionen und Zustände im SVG testen und die Ausgabe in den Streamdeck Developer Tools visuell prüfen.
- [Ohne Prozenttext gehen exakte Zahlen in der Ringansicht verloren] → Bewusster UX-Trade-off des Wunsches; die unveränderte Textansicht bietet weiterhin exakte gerundete Werte, die Ringansicht zeigt proportionale Füllung.
- [Generische Fensternamen sind auf 72×72 kaum unterzubringen] → Bestehende deterministische Kurzlabels verwenden, ihre Trennung nach äußerem/innerem Ring testen, nicht nur unterschiedliche Farben.
- [Hoher GitNexus-Impact auf sichtbare Aktualisierungsprozesse] → Renderer-Sonderfälle und Action-Integration regressionsprüfen, insbesondere stale→recovery, Laden, Präsentationswechsel und Ein-/Zwei-Fenster-Zustände.

## Migration Plan

Keine Datenmigration: die bestehende Präsentations-ID `double-ring` bleibt gültig. Mit dem normalen Plugin-Build und `npm run watch` im Plugin-Verzeichnis ausliefern; zum Zurückrollen genügt die vorherige Renderer-Version, Settings bleiben kompatibel.
