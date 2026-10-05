## 1. Double-Ring-Layout

- [x] 1.1 In `omniroute/src/quota-display/double-ring.ts` beide Ringradien und den gemeinsamen Mittelpunkt auf eine zentrierte, nahezu vollflächige 72×72-Darstellung umstellen; mit Renderer-Tests prüfen, dass Außenring inklusive Strich nicht abgeschnitten wird und 0/100/12,5 Prozent weiterhin korrekt gerendert werden.
- [x] 1.2 Die untere Prozent-/Wertezeile nur aus der Double-Ring-Ausgabe entfernen und kurze nichtnumerische Fensterkennzeichnungen sowie Name/Plan kollisionsfrei platzieren; anhand von SVG-Tests für Session/Weekly, generische Schlüssel und ein einzelnes Fenster prüfen, dass beide Ringe ohne Farbunterscheidung zuordenbar sind und keine numerischen Prozenttexte in der Ringansicht erscheinen.
- [x] 1.3 Status-, Sonderwert- und Footer-Darstellung an die neue Geometrie anpassen; Tests prüfen ∞/?, keine erfundenen Kreise bei Fehler/Laden/ohne Fenster, sichtbares `Alt Offline` und `+1` sowie XML-sichere Namen.

## 2. Regression und visuelle Abnahme

- [x] 2.1 Double-Ring-Erwartungen in `omniroute/src/quota-renderer.test.ts` und `omniroute/src/actions/quota-display.test.ts` für stale→recovery, Instanzwechsel und Präsentationswechsel aktualisieren; mit `npm test` im Verzeichnis `omniroute` prüfen, dass zugleich die Textansicht unverändert Prozentwerte ausgibt.
- [x] 2.2 Mit `npm run build` im Verzeichnis `omniroute` bauen und bei geöffneten Streamdeck Developer Tools mit `npm run watch` die tatsächliche Taste für zwei Fenster, ein Fenster sowie Stale-/Fehlerzustand visuell auf Randbeschnitt, Lesbarkeit und fehlende untere Prozentzeile prüfen; falls Developer Tools geschlossen sind, den Nutzer vor diesem Prüfschritt um Öffnung bitten.
