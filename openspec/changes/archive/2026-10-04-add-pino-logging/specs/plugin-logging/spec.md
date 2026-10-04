## Purpose

Diese Fähigkeit definiert einheitliche, strukturierte und datensparsame Diagnoseausgaben für plugin-eigene Abläufe, ohne das Logging des Stream-Deck-SDKs damit gleichzusetzen.

## ADDED Requirements

### Requirement: Plugin-eigene Logs sind strukturiert und zentral steuerbar
Das Plugin MUST für eigene Diagnosemeldungen einheitliche strukturierte Logs mit Schweregrad und Nachricht ausgeben. Logs MUST standardmäßig auf die Prozessausgabe gehen und MUST anhand einer konfigurierbaren Schweregrad-Schwelle gefiltert werden. Ohne gültige Konfiguration MUST die Schwelle `info` sein; eine ungültige Konfiguration MUST sicher auf `info` zurückfallen.

#### Scenario: Standardmäßige Logausgabe
- **WHEN** Plugin-Code eine Diagnosemeldung mit mindestens dem konfigurierten Schweregrad erzeugt
- **THEN** wird sie als strukturierter Datensatz auf der Prozessausgabe ausgegeben

#### Scenario: Konfigurierte Schweregrad-Schwelle
- **WHEN** die Plugin-Umgebung eine gültige Log-Level-Konfiguration vorgibt
- **THEN** werden Meldungen unterhalb dieser Schwelle nicht ausgegeben und Meldungen auf oder oberhalb der Schwelle ausgegeben

#### Scenario: Fehlende oder ungültige Schweregrad-Konfiguration
- **WHEN** keine gültige Log-Level-Konfiguration vorliegt
- **THEN** verwendet das Plugin `info` als Schwelle und startet weiterhin ohne Logger-Konfigurationsfehler

### Requirement: Zugangsdaten und sensible Werte werden nicht protokolliert
Plugin-eigene Logs MUST Zugangsdaten und andere sensible Werte vor der Ausgabe entfernen oder anderweitig unlesbar machen. Das gilt auch für sensible Felder in verschachtelten strukturierten Logdaten. Logs MUST keine rohen Tokens, Passwörter oder Autorisierungswerte enthalten.

#### Scenario: Sensible strukturierte Felder
- **WHEN** ein Log-Datensatz sensible Felder auf oberster oder verschachtelter Ebene enthält
- **THEN** erscheinen deren Werte in der Ausgabe nicht im Klartext

#### Scenario: Diagnosemeldung enthält keine Zugangsdaten
- **WHEN** ein Plugin-Ablauf eine Diagnosemeldung ausgibt
- **THEN** enthält die Meldung keine rohen Zugangsdaten oder sonstigen geheimen Werte

### Requirement: SDK-Logging bleibt eine separate Ebene
Plugin-eigene Logs MUST über eine plugin-eigene Logging-Schnittstelle ausgegeben werden. Die Integration MUST den Stream-Deck-SDK-Logger als separate Komponente behandeln und MUST dessen Nachrichten nicht ungeprüft durch Pino duplizieren oder an Pino weiterleiten. Eine SDK-Logstufe, die sensible SDK-Nachrichten erfassen kann, MUST nicht ohne ausdrückliche sichere Begründung aktiviert sein.

#### Scenario: Plugin-eigener Logaufruf
- **WHEN** Plugin-Code eine Diagnosemeldung protokolliert
- **THEN** wird diese über die plugin-eigene Logging-Schnittstelle ausgegeben, unabhängig von SDK-internen Logs

#### Scenario: SDK-Trace-Level
- **WHEN** die Plugin-Initialisierung die SDK-Logstufe konfiguriert
- **THEN** wird `trace` nicht standardmäßig aktiviert, sofern keine sichere Begründung dafür dokumentiert ist
