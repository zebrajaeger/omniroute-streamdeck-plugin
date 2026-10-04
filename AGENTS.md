# Projektregeln

## Projekt und Änderungen

- Dieses Repository entwickelt ein **OmniRoute-Stream-Deck-Plugin**, kein OpenCode-Plugin. Änderungen am Plugin-Code unterbrechen die laufende OpenCode-Sitzung normalerweise nicht; Regeln über atomaren Austausch eines laufenden OpenCode-Plugins gelten hier nicht.
- Das eigentliche Plugin liegt im ausdrücklich vereinbarten Unterordner `omniroute` (Schreibweise beibehalten). `idea.md` hält die ursprüngliche Idee und API-Beispiele fest, `konzept.md` das technische Konzept; die freigegebenen Anforderungen und Aufgaben stehen in `openspec/changes/`.
- Vor Implementierung eines Changes dessen Proposal, Spec, Design und Tasks lesen; Abweichungen erst mit den OpenSpec-Artefakten abgleichen. Zugangsdaten gehören weder in Quellcode noch in Action-Settings, Button-Grafiken oder Logs.

## GitNexus und OpenSpec-Abschluss

- Wenn der GitNexus-Index veraltet ist, vom Repository-Wurzelverzeichnis `node .gitnexus/run.cjs analyze --index-only` ausführen. Danach gelten die Impact- und Änderungsprüfungen im verwalteten GitNexus-Block unten.
- Vor `openspec archive` den Change validieren und seine Delta-Specs prüfen. Die hier installierte CLI übernimmt Delta-Specs beim Archivieren in die Haupt-Specs; danach das Ergebnis unter `openspec/specs/` kontrollieren. Für reine Dokumentations-/Tooling-Changes mit `skip_specs: true` ist kein Spec-Sync nötig. Anschließend den GitNexus-Index aktualisieren. Änderungen an bereits vorhandenen Dateien dabei nicht ungeprüft überschreiben.
- Commit-Nachrichten für OpenSpec-Implementierungen: `<typ>: [<OpenSpec-Change-Name>] <Beschreibung>`; beispielsweise `feature: [verbindungstaste] Quota-Anzeige ergänzen`. Passenden Typ wie `fix`, `feature` oder `docs` wählen.
- Commit und insbesondere Push nur ausführen, wenn der Nutzer das ausdrücklich beauftragt hat. Vor jedem beauftragten Commit die unten beschriebene GitNexus-Änderungsanalyse durchführen; den Push nie als automatische Folge einer Archivierung behandeln.

## Development

- Nutze die Streamdeck Developer Tools für Test, Debugging und Development. 
  Sind die Tools nicht offen, dann bitte den Benutzer, sie zu öffnen.
- Nutze den "IntelliJ mcp server" falls verfügbar.
- Damit die Codeänderungen wirksam werden, muss im Plugin-verzeichnis `npm run watch` laufen. 
  Das Plugin wird dann automatisch neu geladen, sobald die Änderungen gespeichert werden. 
  Die Änderungen werden nicht wirksam, wenn das Plugin nicht neu geladen wird.

## UI
- Verwende bevorzugt die offiziellen Streamdeck UI Komponenten https://sdpi-components.dev/ . 

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **omniroute-streamdeck-plugin** (34 symbols, 30 relationships, 0 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/omniroute-streamdeck-plugin/context` | Codebase overview, check index freshness |
| `gitnexus://repo/omniroute-streamdeck-plugin/clusters` | All functional areas |
| `gitnexus://repo/omniroute-streamdeck-plugin/processes` | All execution flows |
| `gitnexus://repo/omniroute-streamdeck-plugin/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
