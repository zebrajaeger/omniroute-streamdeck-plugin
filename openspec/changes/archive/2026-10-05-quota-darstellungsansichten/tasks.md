## 1. Gemeinsames Anzeigemodell und Darstellungskatalog

- [ ] 1.1 Vor jedem Implementierungsedit GitNexus-Impact für betroffene Symbole (insbesondere `quotaRenderModel`, `quotaSvg`, `quotaImage`, `QuotaAction` und Inspector-Handler) ausführen; Caller, Prozesse und Risiko dokumentieren, HIGH/CRITICAL melden und UNKNOWN per gezielter Quellsuche auflösen. Verifikation: nachvollziehbare Impact-Ergebnisse vor den jeweiligen Edits.
- [x] 1.2 Modellbildung und SVG-Helfer unter `omniroute/src/quota-display/` trennen und den öffentlichen Einstieg `quota-renderer.ts` erhalten; originale Window-Keys, typisierte Prozentwerte, Anzeigetext, Namen, Plan und Status erhalten. Verifikation: Renderer-Tests für Codepunkt-Sortierung, Overflow, Sonderwerte, Statusprioritäten und XML-Sicherheit bestehen.
- [x] 1.3 Textrenderer und Katalog mit IDs `text`/`double-ring`, Metadaten und zentralem Fallback-Resolver einführen. Verifikation: alte Settings und fehlende/malformed/unbekannte IDs erzeugen die kompatible Textansicht; ein testweiser zusätzlicher Renderer ist ohne neue Action-Branches dispatchbar und im Katalog sichtbar.
- [x] 1.4 `presentation`/`displayName` normalisieren und automatischen Provider-Namen vom Override unterscheiden. Verifikation: Tests für nichtleere Namen, Trimming, Leer-/Whitespace-Reset, Unicode-Kürzung und sichere Ausgabe bestehen; ohne Override bleibt die Textansicht unverändert.

## 2. Doppelringrenderer

- [x] 2.1 Doppelring-SVG mit neutralen Tracks, konstantem Außen-/Innenstyling, zentralem Namen und Plan sowie lesbaren Window-Labels/Werten implementieren. Verifikation: session=84/weekly=76 ergibt außen/innen 84/76 Prozent, `S 84%`/`W 76%`, zentrale Beschriftung und 72×72-Ausgabe unabhängig von Response-Reihenfolge.
- [x] 2.2 Geometrische Grenzfälle und Sonderzustände ergänzen: 0, 100, Bruchteile, unbegrenzt, unbekannt, ein/kein Fenster, generische Keys und Overflow. Verifikation: gezielte SVG-/Geometrietests prüfen Start oben, Uhrzeigersinn, ungerundete Ringlänge, Text-Rundung und keine erfundenen Werte oder Fortschrittsarcs.
- [x] 2.3 Gemeinsame Statusausgabe sowie Stale-/Fehler-Footer in Doppelring integrieren. Verifikation: Tests für alle bisherigen Konfigurations-/Fehlerzustände, cached Stale-Werte, Recovery und Instanzwechsel bestätigen sichtbare Warnungen und Entfernung alter Werte.

## 3. Action-Integration und sichere Settings

- [x] 3.1 Ansicht und Namen aus Action-Settings an den gemeinsamen Renderer übergeben, ohne bestehende Writer-/Revision-Logik zu duplizieren. Verifikation: `quota-display.test.ts` prüft sofortige unabhängige Ansichts-/Namensupdates, langsame Writes, Coalescing, Disappear/Reappear und weiterhin nur ein Service-Abonnement ohne neue Quota-Requests.
- [x] 3.2 Kontextgebundene Metadaten-Nachricht für Katalogoptionen sowie Nachrichten für Ansicht/Namen ergänzen; Verbindung, Ansicht und Name über eine gemeinsame pro-Action serialisierte Read-modify-write-Strecke speichern. Verifikation: Action-Tests für schnelle gemischte Updates, unbekannte IDs, fremde/geschlossene Inspector-Kontexte und Erhalt beliebiger Settings bestehen; Credentials werden nicht übertragen oder geloggt.

## 4. Property Inspector

- [x] 4.1 In `quota.html` offizielle SDPI-Komponenten für Darstellung und Namen sowie einen kontrollierten Inspector-Skriptpfad ergänzen; Verbindungsauswahl, Reload und Connection-Modal erhalten. Verifikation: DOM-/Inspector-Tests prüfen vorhandene und neue Controls, Katalogoptionen und die sichere reine Textausgabe.
- [x] 4.2 Darstellungseinstellung kontextgebunden laden, anzeigen, speichern und nach Restart wiederherstellen; neue Optionen aus Plugin-Metadaten statt einer zweiten hardcodierten Liste beziehen. Verifikation: Inspector-Tests für unabhängige Tasten, Text-Default, unbekannte gespeicherte ID ohne automatisches Umschreiben und eine zusätzliche Testoption bestehen.
- [x] 4.3 Automatischen Provider-Namen vorbefüllen, Override speichern und Leer-/Whitespace-Eingaben zurücksetzen; Pending-Edits gegen verspätete Settings-/Discovery-Nachrichten schützen. Verifikation: Inspector-Tests prüfen Prefill ohne Settings-Write, fehlende Metadaten, Custom-Name bei Verbindungswechsel, automatischen Namenswechsel, Reset sowie verzögerte/fremde Antworten.

## 5. Gesamtverifikation und Dokumentation

- [x] 5.1 Bedienung und Erweiterungspfad in `omniroute/README.md` dokumentieren, einschließlich Standardansicht, Namens-Prefill/Reset, Ringbedeutung und Katalogintegration weiterer Renderer. Verifikation: Dokumentation stimmt mit implementierten Settings und Selector-Verhalten überein.
- [x] 5.2 Im Unterordner `omniroute` `npm test`, `npx tsc --noEmit` und `npm run build` ausführen. Verifikation: alle Befehle erfolgreich; bestehende Provider-, Connection-Modal-, Datenservice- und Lifecycle-Regressionstests bleiben grün.
- [ ] 5.3 Reale Ansicht über Stream Deck Developer Tools prüfen; Benutzer bei geschlossenen Tools um Öffnen bitten und laufendes `npm run watch` sicherstellen. Verifikation: Originalgröße zeigt Name/Plan, beide Ringwerte, Sonderwerte, lange/generische Labels und gleichzeitig Stale/Overflow ohne unlesbare Überlagerung; nach Settings-Wechsel und Plugin-Restart bleibt die lokale Auswahl korrekt. Falls die Umgebung fehlt, den offenen manuellen Nachweis ausdrücklich dokumentieren statt ihn als bestanden zu markieren.
- [x] 5.4 Anforderungen und Nachweise gegen die Delta-Spec abgleichen und `openspec validate quota-darstellungsansichten --strict` ausführen. Verifikation: alle Szenarien sind Tests oder dokumentierten manuellen Nachweisen zugeordnet und die Change-Validierung besteht; Implementierungsabschluss nicht mit Archivierung, Commit oder Push verwechseln.
