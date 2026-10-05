## 1. Fehlerpfad reproduzieren

- [x] 1.1 Mit geöffneten Stream Deck Developer Tools und laufendem `npm run watch` die Ereignisse von `#quota-display-name` beim Tippen und Verlassen des Felds sowie den tatsächlichen Inspector→Plugin-Settings-Pfad nachvollziehen; verifizieren, ob und wann der Wert an `setDisplayName` gesendet und auf der Taste sichtbar wird.
- [x] 1.2 In `omniroute/src/provider-selector.test.ts` einen fehlschlagenden Regressionstest für die beobachtete `sdpi-textfield`-Ereignisfolge ergänzen; prüfen, dass eine explizite Eingabe genau einen Schreibauftrag erzeugt und automatische Vorbelegung keinen.

## 2. Namensänderung zuverlässig übernehmen

- [x] 2.1 `omniroute/de.lars-brandt.omniroute.sdPlugin/ui/provider-selector.js` gezielt an die beobachteten Textfeldereignisse und Werte anpassen; per Inspector-Test nachweisen, dass nichtleere Namen und Leerungen als korrekte `setDisplayName`-Nachrichten gesendet werden, ohne doppelte Commits.
- [x] 2.2 Namenszustand bei verspäteter Provider-Discovery, Settings-Nachrichten und fehlgeschlagenen oder schnell aufeinanderfolgenden Speichervorgängen stabilisieren; Inspector-Tests für Wiederherstellung, Override-Priorität und fehlerhafte/alte Antworten bestehen lassen.
- [x] 2.3 Falls die Reproduktion eine Plugin-seitige Lücke zeigt, `QuotaAction.onSendToPlugin` für erfolgreiche Namens-Schreibvorgänge korrigieren; in `omniroute/src/actions/quota.test.ts` nachweisen, dass `displayName` nur pro Action persistiert, blanke Eingaben ihn entfernen und gemischte Settings erhalten bleiben.
- [x] 2.4 Die wörtliche Folge `\n` beim Speichern eines benutzerdefinierten Namens unverändert erhalten; in Inspector-/Action-Tests prüfen, dass `Work\nTeam` nach erneutem Öffnen weiterhin genau so im Feld steht und der automatische Provider-Name nicht überschrieben wird.

## 3. Darstellung und Integration prüfen

- [x] 3.1 In Action-/Renderer-Tests absichern, dass ein gespeicherter Name unmittelbar ohne Settings-Echo oder Quota-Fetch in Text- und Double-Ring-Ansicht erscheint, nach Neustart/erneutem Öffnen erhalten bleibt und andere Keys nicht verändert; `omniroute/src/actions/quota-display.test.ts` und `omniroute/src/quota-renderer.test.ts` ausführen.
- [x] 3.2 In `omniroute/src/quota-display/model.ts`, `text.ts` und `double-ring.ts` die Darstellung benutzerdefinierter `\n`-Namen ergänzen; Renderer-Tests müssen zwei getrennte Zeilen, sichere Maskierung und deterministische Kürzung bei Platzmangel sowie unveränderte Quota-/Plan-/Statuspositionen der Textansicht und Statuspositionen der Ringansicht belegen.
- [x] 3.4 Die Double-Ring-Ansicht auf ausschließlich den effektiven Namen im tatsächlichen Ringzentrum umstellen (auch ohne individuellen Namen); Plan und Fensterlegende entfernen, Sonderwerte und Footer erhalten. Renderer-/Action-Tests für beide Ringmittelpunkte, ein- und mehrzeilige Namen, Textansicht und Statusfälle ausführen.
- [x] 3.5 Die sichtbare Glyphenmitte des Namens in beiden Double-Ring-Fällen (eine/mehrere Zeilen, mit/ohne Footer) anhand gerenderter SVGs prüfen und optisch am Ringmittelpunkt ausrichten; automatisierte Bild-/Geometrieprüfung sowie unveränderte Textansicht, Ringgeometrie und Statusanzeige nachweisen.
- [x] 3.3 Im laufenden Stream Deck über Developer Tools den vollständigen Ablauf mit nichtleerem, blankem und `Work\nTeam`-Namen, Präsentations-/Verbindungswechsel und erneutem Öffnen prüfen; danach Build und vollständige Tests im `omniroute`-Projekt ausführen und das Ergebnis gegen `specs/quota-key-display/spec.md` abgleichen.
