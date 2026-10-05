## Context

See `proposal.md` for motivation. The repository root has no README, while `omniroute/README.md` contains short German notes on logging, runtime packaging, tests and key presentation. The executable plugin is under `omniroute/`: `package.json` provides `build`, `watch` and `test`; `manifest.json` targets Stream Deck 7.1+, macOS 12+ or Windows 10+, Node.js 24. The Quota inspector (`ui/quota.html`) has a connection-settings modal, connection selector, presentation selector, ring color selector and display-name field. Source polls OmniRoute via a shared service every 20 seconds. The current manifest also registers a separate connection-settings action, despite the main `connection-settings` spec saying that a standalone action is not required; document the supported inspector workflow rather than asserting that the standalone action is absent.

## Goals / Non-Goals

**Goals:**
- Make two root-level language entry points with matching section structure and verified setup instructions.
- Keep user instructions actionable without exposing credentials or assuming unpublished release/download links.
- Separate current features from development concepts in `konzept.md`.

**Non-Goals:**
- Reorganizing `omniroute/README.md`, changing the plugin or updating runtime/spec behavior.
- Promising an installer, release artifact or workflow that is not present in the repository.

## Decisions

- Place English `README.md` and German `README_de.md` at repository root; cross-link at the top and link to the existing implementation README. Alternative: extend only `omniroute/README.md`; rejected because the repository root would remain without an entry point and languages would be mixed.
- Use parallel sections for overview, prerequisites, local build/installation, connection setup, quota-key use, troubleshooting and development. Validate facts against `omniroute/package.json`, the manifest, inspector UI and the existing source/specs. Alternative: translate `konzept.md`; rejected because it contains future-looking proposals rather than only implemented features.
- Describe local setup with commands executed in `omniroute/` (`npm ci`, `npm run build`, `npm test`, `npm run watch`), distinguish building from installing/activating, and give an installation instruction only when verified against the local tooling or official Stream Deck process. Never ask readers to paste API keys into repo files, screenshots, commands or issue reports. Alternative: imply `npm run build` installs the plugin; rejected because the script only builds/packages runtime dependencies.
- If a Mermaid diagram adds value, show OmniRoute → shared polling/cache → independent Quota keys and accompany it with prose. Alternative: diagram-only explanation; rejected because some Markdown renderers do not support Mermaid.

## Risks / Trade-offs

- [Documentation drifts from code/spec discrepancies] → Recheck claims against the current manifest, UI and service at implementation time; avoid absolute claims about standalone action availability.
- [Installation guidance becomes misleading] → Verify the chosen local activation command/path before writing it; otherwise state the build output and refer to Stream Deck developer tooling without inventing a one-command install.
- [Bilingual documents diverge] → Compare headings, steps, links and safety guidance side by side, allowing natural rather than literal translation.

## Migration Plan

No migration. Add documentation only; rollback consists of removing the two newly added root READMEs if necessary. Existing `omniroute/README.md` remains unchanged.
