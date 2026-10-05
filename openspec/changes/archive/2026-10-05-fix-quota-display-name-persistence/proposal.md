## Why

Der „Display name“ im Quota-Property-Inspector hat laut Fehlerbericht derzeit weder eine dauerhafte Wirkung noch ersetzt er den automatischen Namen auf der Taste. Das widerspricht der bestehenden Anforderung an einen pro Taste gespeicherten Anzeigenamen und soll ohne Änderung der gemeinsamen Verbindungsdaten behoben werden.

## What Changes

- Explizite Änderungen am Anzeigenamen aus dem Property Inspector zuverlässig als Action-Setting speichern und anschließend die sichtbare Taste aktualisieren.
- Einen gespeicherten nichtleeren Namen nach erneutem Öffnen und Plugin-Neustart wiederherstellen und in Text- und Double-Ring-Ansicht statt des Provider-Namens anzeigen.
- Leere oder ausschließlich aus Leerzeichen bestehende Eingaben als Entfernen des Overrides behandeln; automatische Vorbelegung nicht als Benutzereingabe speichern.
- Die eingegebene Zeichenfolge `\n` im individuellen Namen als Zeilenumbruch darstellen. In der Textansicht bleibt der Name im bisherigen Namensbereich; in der Double-Ring-Ansicht ersetzt der horizontal und vertikal im Ringzentrum ausgerichtete Name den Plantext und die Fensterkennzeichnung (`S / W`). Status- und Überlaufhinweise bleiben erhalten.
- Regressionen für reale Textfeld-Ereignisse, ausbleibende Settings-Echos, asynchrone Antworten und unabhängige Tasten abdecken.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `quota-key-display`: Namenspersistenz und mehrzeilige Darstellung ergänzen sowie die Double-Ring-Anforderungen an Plananzeige und Fensterkennzeichnung zugunsten eines mittig platzierten Namens ändern.

## Impact

- Betroffen sind voraussichtlich `omniroute/de.lars-brandt.omniroute.sdPlugin/ui/provider-selector.js`, `omniroute/src/actions/quota.ts`, `omniroute/src/quota-display/model.ts`, `omniroute/src/quota-display/text.ts`, `omniroute/src/quota-display/double-ring.ts` und zugehörige Tests; der vorhandene SVG-Texthelfer ersetzt Steuerzeichen derzeit durch Leerzeichen und muss für gezielte Umbrüche im Namen umgangen bzw. ergänzt werden.
- Kein neues Setting und keine Migration: `displayName` bleibt ein optionales Action-Setting, nicht Teil der pluginweiten Verbindungsdaten. Quota-Abruf und andere Tasten dürfen durch Namensänderungen nicht verändert werden.
- GitNexus zeigt für `QuotaAction` Aufrufer in `plugin.ts` und Action-Tests; `updateName` hängt an Discovery-/Inspector-Flows. Die genaue Ursache im Zusammenspiel mit der offiziellen `sdpi-textfield`-Komponente ist vor der Codeänderung zu verifizieren.
