## Context

Siehe `proposal.md` für die Motivation und `specs/plugin-logging/spec.md` für das Verhaltenscontract. Das Runtime-Projekt unter `omniroute/` ist TypeScript mit ESM (`"type": "module"`), nutzt Rollup als Bundler und baut `src/plugin.ts` zu `de.lars-brandt.omniroute.sdPlugin/bin/plugin.js`. Die bestehende Rollup-Konfiguration löst Runtime-Abhängigkeiten für Node auf und bevorzugt Node-Built-ins. Im Einstiegspunkt wird aktuell der Stream-Deck-SDK-Logger explizit auf `trace` gesetzt. Das Manifest führt Node.js 24 als Plugin-Runtime auf.

## Goals / Non-Goals

**Goals:**
- Eine kleine zentrale Pino-Instanz für plugin-eigene strukturierte Diagnosemeldungen vorsehen.
- Log-Schwelle über eine Laufzeitkonfiguration steuern und bei fehlender oder ungültiger Konfiguration sicher `info` verwenden.
- Geheimnisse bereits beim Logger-Ausgang redigieren und anwendungsseitig keine vertraulichen Werte in Freitext-Meldungen aufnehmen.
- Abhängigkeiten und Ausgabe mit dem bestehenden ESM-/Rollup-/Stream-Deck-Laufzeitmodell kompatibel halten.
- Die SDK-Logging-Ebene separat behandeln und den expliziten SDK-Trace-Modus sicher bewerten.

**Non-Goals:**
- SDK-interne Meldungen an Pino weiterleiten oder doppelt ausgeben.
- Persistente Logdateien, Rotation, entfernte Logsammler, UI-Einstellungen oder eine neue Property-Inspector-Konfiguration einführen.
- Zugangsdaten oder andere Geheimnisse protokollieren, selbst wenn diese später redigiert werden könnten.

## Decisions

1. **Pino als Runtime-Abhängigkeit und gebündelten Logger verwenden.** Das Plugin läuft in einer Node-Umgebung und Rollup baut den TypeScript-Einstiegspunkt samt aufgelösten Runtime-Abhängigkeiten in die Plugin-Binärdatei. Pino gehört daher in `dependencies` und muss in einem Build-Artefakt verfügbar sein. Vor Umsetzung ist zu bestätigen, dass die vom installierten Pino-Release verwendeten Node-APIs und `pino`-Einstiegspunkte von der bestehenden Rollup-Auflösung unterstützt werden. Alternative: Pino extern lassen; dies wird vermieden, weil das Manifest keinen Installations- oder Liefermechanismus für npm-Pakete zur Laufzeit beschreibt.

2. **Einen Logger zentral an einer Plugin-internen Schnittstelle initialisieren.** Der Einstiegspunkt konfiguriert die Instanz einmal; Plugin-Module importieren die zentrale Instanz, anstatt Logger unabhängig mit unterschiedlichen Optionen zu erzeugen. Die Implementierung liest `OMNIROUTE_LOG_LEVEL` und validiert den Wert gegen unterstützte Pino-Level. Die Variable und ihre gültigen Werte werden in knapper Entwicklerdokumentation festgehalten. Alternative: nur einen fest codierten Level anbieten; die Konfiguration bleibt bevorzugt, weil sie Diagnose in verschiedenen Umgebungen erlaubt, ohne Änderungen am Code zu benötigen.

3. **JSON auf die Prozessausgabe mit einem sicheren Standard ausgeben.** Der Pino-Standardtransport wird genutzt; Datei-Transporte und externe Pretty-Printer gehören nicht in den Plugin-Laufzeitpfad. Das hält den Build schlank und vermeidet plattformabhängige Dateipfade und Rotationslogik. Alternative: persistente Dateien; ausgeschlossen, da dafür Speicherort, Berechtigungen, Rotation und Bereinigung erforderlich wären.

4. **Sensible Felder zentral redigieren und Logs sparsam gestalten.** Pino-Redaction schützt bekannte Schlüssel wie Token-, Passwort- und Authorization-Felder auch in verschachtelten Objekten. Plugin-Code soll nur tatsächlich erforderliche, nicht geheime Diagnosedaten strukturieren; unstrukturierter Freitext kann keine zuverlässige Schlüssel-Redaction garantieren. Alternative: alleinige Disziplin der Aufrufer; sie ist für strukturierte Felder weniger zuverlässig und wird daher durch eine zentrale Schutzschicht ergänzt.

5. **SDK-Logger getrennt und ohne ungeprüftes Trace behandeln.** Pino wird nicht als Adapter des SDK-Loggers eingesetzt. Die vorhandene explizite SDK-Konfiguration `trace` wird entfernt oder auf einen nachweislich sicheren Level gesetzt; dies ändert nur SDK-Diagnoseumfang und führt Pino nicht in SDK-internen Code ein. Alternative: Trace unverändert lassen; das ist mit dem Datensparsamkeitsziel wegen möglicher sensibler Protokollinhalte nicht vereinbar.

6. **Logger-Sicherheitsverhalten automatisiert testen.** Da das Repository derzeit kein Test-Framework konfiguriert hat, werden Tests mit `node:test` und einem TypeScript-kompatiblen Test-Runner ausgeführt. Die Konfiguration soll so geschnitten sein, dass Level-Fallback und Redaction ohne Stream-Deck-Verbindung geprüft werden können. Alternative: ausschließlich manuelle Prüfung im Developer Tools; diese deckt Regressionen bei Konfiguration und Redaction nicht zuverlässig ab.

## Risks / Trade-offs

- [Pino nutzt APIs, die durch Rollup-Auflösung oder die Elgato-Node-Runtime nicht unterstützt werden] → Runtime-Kompatibilität anhand des gebündelten Outputs prüfen und einen Plugin-Build sowie einen Start im Stream-Deck-Developer-Setup durchführen.
- [Unbekannte geheime Feldnamen werden nicht durch die Redaction-Liste erkannt] → Redaction-Liste auf verbreitete Auth-/Token-/Passwortnamen ausrichten und Aufrufer verpflichten, Geheimnisse nicht in Freitext zu schreiben.
- [Weniger SDK-Ausgaben nach Entfernung von Trace erschweren SDK-Diagnose] → SDK-Logger separat und auf einem bewusst gewählten, nicht zu ausführlichen Level belassen; bei gezielter Diagnose kann die Stufe temporär kontrolliert geändert werden, ohne sie als Standard zu aktivieren.
- [Prozessausgabe kann vom Stream Deck bzw. dessen Startumgebung begrenzt oder verworfen werden] → Keine Persistenz versprechen; die Spezifikation garantiert strukturierte Ausgabe an stdout, nicht Aufbewahrung durch den Host.

## Migration Plan

1. Pino samt zentraler Initialisierung, validiertem Level und Redaction konfigurieren; den bisherigen expliziten SDK-Trace-Level sicher anpassen.
2. Build ausführen und sicherstellen, dass die gebündelte Plugin-Datei Pino ohne zur Laufzeit fehlende Module enthält.
3. Plugin mit Stream Deck Developer Tools starten und prüfen, dass Logs auf der Prozessausgabe erscheinen und sensible Testwerte redigiert werden.
4. Rollback: zentrale Pino-Aufrufe und Runtime-Abhängigkeit zurücknehmen und die SDK-Logging-Einstellung getrennt wieder auf den zuvor verwendeten Wert setzen, falls die Laufzeitintegration Probleme verursacht. Trace darf nicht als beiläufiger Rollback wieder zum unkritischen Standard werden.
