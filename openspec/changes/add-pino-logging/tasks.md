## 1. Logger-Abhängigkeit und zentrale Konfiguration

- [ ] 1.1 Pino als Runtime-Abhängigkeit hinzufügen und Installation/Lockfile aktualisieren; verifizieren, dass die Abhängigkeit in `omniroute/package.json` und dem Lockfile konsistent vorhanden ist.
- [ ] 1.2 Zentrale Pino-Logger-Schnittstelle für Plugin-Code implementieren, `OMNIROUTE_LOG_LEVEL` validieren und auf `info` zurückfallen; mit automatisierten Tests für gültige, fehlende und ungültige Werte verifizieren.
- [ ] 1.3 Sensible Authentifizierungs-, Token- und Passwortfelder auch in verschachtelten Logobjekten redigieren; mit automatisierten Tests belegen, dass Testgeheimnisse nicht in der Ausgabe erscheinen.
- [ ] 1.4 Rollup-Konfiguration bei Bedarf für Pino-Kompatibilität anpassen; `npm run build` im Verzeichnis `omniroute/` ausführen und prüfen, dass der Plugin-Build ohne fehlende Laufzeitmodule gelingt.

## 2. Plugin-Integration und Verifikation

- [ ] 2.1 Den expliziten SDK-Trace-Level in `src/plugin.ts` entfernen oder sicher absenken und den zentralen Logger verfügbar machen; durch Code-/Konfigurationstest bestätigen, dass SDK-Logs nicht an Pino weitergeleitet werden und Trace nicht Standard ist.
- [ ] 2.2 Plugin-eigene Diagnosemeldungen über die zentrale Schnittstelle integrieren, ohne Geheimnisse in strukturierten Feldern oder Freitext auszugeben; mit gezielten Tests bzw. nachvollziehbaren Log-Beispielen verifizieren.
- [ ] 2.3 `OMNIROUTE_LOG_LEVEL` und dessen sichere Standardstufe in Entwicklerdokumentation festhalten und mit Stream Deck Developer Tools den Start, stdout-Ausgabe und tatsächliche Redaction verifizieren.
