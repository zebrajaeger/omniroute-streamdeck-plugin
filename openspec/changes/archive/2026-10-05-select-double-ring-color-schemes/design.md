## Context

Siehe `proposal.md` und `specs/quota-key-display/spec.md`. Der aktuelle Double-Ring-Renderer `omniroute/src/quota-display/double-ring.ts` setzt Außen-/Innenfarbe hart auf `#38bdf8`/`#a78bfa`, Track und Hintergrund sind neutral. Der Präsentationskatalog ruft ihn über `quotaImage` auf; `QuotaAction.render` leitet derzeit Verbindung, Präsentation und Anzeigename aus Action-Settings weiter. Im Inspector verwaltet `provider-selector.js` die Auswahl mit asynchroner Settings-Wiederherstellung und bestätigten Speicherantworten. Das parallele Change `expand-double-ring-to-full-key` ersetzt Ringgeometrie und Beschriftungsanordnung; hier dürfen keine absoluten Positionen festgeschrieben werden.

## Goals / Non-Goals

**Goals:**
- Eine einzige zentrale, typisierte Palette-Liste für Renderer und Inspector; gespeicherte stabile IDs statt frei eingegebener Farben.
- Settings-Änderungen auf demselben serialisierten Schreibpfad wie Präsentations- und Namensänderungen durchführen; kein zusätzlicher Quota-Abruf.
- Farbzuordnung ausschließlich an den bestehenden Außen-/Innenindex knüpfen, unabhängig von Radius, Labels und Progress-Berechnung.

**Non-Goals:**
- Benutzerdefinierte Hex-Farben, Farbeditor, dynamische Theme-Erkennung oder Änderungen am Text-Renderer.
- Neue Fensterreihenfolge, Änderungen an API/Quota-Modell oder pro Verbindung geteilte Farbschema-Einstellungen.

## Decisions

1. **Fester Palettenkatalog mit explizitem Default.** Eine kleine neue Datei unter `omniroute/src/quota-display/` definiert stabile IDs, Inspector-Labels und Paare für Außen-/Innenring. Zehn unterschiedliche Kombinationen auf dem dunklen Tastengrund: die bestehenden `classic` (`#38bdf8` cyan außen, `#a78bfa` violett innen), `warm` (`#fbbf24` amber außen, `#2dd4bf` türkis innen), `vivid` (`#a3e635` limette außen, `#f472b6` pink innen) sowie `sunset` (`#fb923c` orange / `#c084fc` lavendel), `ocean` (`#22d3ee` aqua / `#fbbf24` gold), `forest` (`#4ade80` grün / `#fda4af` rosa), `royal` (`#818cf8` indigo / `#facc15` gelb), `ember` (`#fb7185` koralle / `#67e8f9` eisblau), `orchid` (`#e879f9` magenta / `#86efac` mintgrün) und `solar` (`#fde047` sonnengelb / `#f9a8d4` pink). Auf der tatsächlichen 72×72-Taste visuell nachprüfen und gegebenenfalls Werte bei gleichbleibenden IDs und Kontrastanforderungen justieren. Ein Resolver nimmt `unknown` entgegen und fällt bei fehlendem/ungültigem/unbekanntem Wert auf `classic` zurück, ohne Settings zu schreiben. Alternative freie Farbeingabe verworfen: erschwert Kontrastkontrolle und sichere Darstellung.
2. **Palette nur im Double-Ring-Rendering auswerten.** `quotaImage` erhält das optionale Schema als weiteres Argument am Ende; bestehende Aufrufer bleiben kompatibel. Die Präsentations-Renderfunktion erhält optional die aufgelöste Palette (oder einen kleinen Render-Kontext); der Text-Renderer ignoriert sie, der Double-Ring-Renderer ersetzt nur die zwei Akzentfarben, einschließlich des unbegrenzten gestrichelten Rings. Track, Hintergrund, Status-/Warnfarben und Progress-Logik bleiben erhalten. Alternative: dynamische neue Präsentations-IDs pro Palette; verworfen, weil Palette und Präsentation orthogonale Settings sind.
3. **Inspector als pro-Taste-Setting.** Zusätzliches `<sdpi-select>` für das Schema in `quota.html`, sichtbar bzw. aktiv nur in der Double-Ring-Präsentation; gespeichertes Schema bleibt beim Wechsel zu Text erhalten. `QuotaAction` beantwortet eine Kataloganfrage mit IDs/Labels und validiert `selectColorScheme` gegen die feste Liste. Der Speicherpfad nutzt `settingWrites`, liest aktuelle Action-Settings und schreibt `{ ...settings, colorScheme: id }`; das unmittelbare Bild-Update nutzt `render` wie beim Präsentationswechsel. In `provider-selector.js` erfolgt die Initialisierung aus Action-Settings ohne implizites Speichern; Auswahl und Bestätigung mit Request-ID und pending/confirmed-Zustand analog zur Präsentation, damit späte Antworten, schnelle Wechsel und Fehlversuche die neueste Auswahl nicht zurücksetzen. Alternative direkte PI-Settings-Bindung verworfen, da sie den bestehenden pluginseitigen Serialisierungs-/Bestätigungspfad umgeht.

## Risks / Trade-offs

- [Gleichzeitige Umsetzung des vergrößerten Ringlayouts] → Vor Implementierung/Archivierung `expand-double-ring-to-full-key` mit aktueller Haupt-Spec und Renderer abgleichen; Farbzuweisung ohne Annahmen über Mittelpunkt, Radius oder Prozenttexte implementieren.
- [Farbpaare wirken auf physischer Taste weniger deutlich als im SVG] → Alle zehn Kombinationen auf dunklem Grund in Streamdeck Developer Tools bei realer Tastengröße prüfen; Labels/Position bleiben farbunabhängig.
- [Veraltete PI-Nachrichten oder Settings-Echos überschreiben frische Auswahl] → Request-ID, Kontextprüfung und bestätigte/pending Auswahl gegen schnelle Folgewechsel und Speicherfehler testen.
- [Hoher GitNexus-Impact des Renderers: CRITICAL, 11 Knoten/fünf Prozesse] → Render-/Action-Regressionen für Updates, Sonderzustände und zwei unabhängig konfigurierte Tasten; `npm test`/Build plus manuelle Sichtprüfung.

## Migration Plan

Keine Datenmigration. Fehlendes oder unbekanntes `colorScheme` wird nur zur Anzeige als `classic` interpretiert; vorhandene gespeicherte unbekannte Werte bleiben erhalten, bis ein Nutzer bewusst neu auswählt. Plugin mit regulärem Build und laufendem `npm run watch` neu laden; Rücknahme des Features lässt die zusätzlichen Action-Settings unangetastet und die alte Ringansicht wieder in den bisherigen Farben erscheinen.
