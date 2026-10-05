## Why

The repository lacks a root-level entry point for users and contributors. The existing `omniroute/README.md` documents selected implementation details in German, but does not provide a complete English/German overview of the plugin, setup, usage, or development workflow.

## What Changes

- Add a root-level `README.md` in English and `README_de.md` in German, with reciprocal language links.
- Explain the plugin's current quota feature, requirements, installation/build, OmniRoute connection setup, key configuration, troubleshooting, and local development/testing using verified project commands.
- Include a small Mermaid architecture diagram only where it clarifies the shared polling and per-key display; provide adjacent prose so the content remains understandable without Mermaid support.
- Link to `omniroute/README.md` for existing implementation notes and avoid presenting concepts or future ideas as released functionality.

## Capabilities

### New Capabilities

None; this change documents existing behavior only.

### Modified Capabilities

None; no plugin requirements or runtime behavior change. `skip_specs: true` records the documentation-only scope.

## Impact

Only the new root-level Markdown documents and OpenSpec planning artifacts. No plugin code, API, dependencies, settings format, or shipped action behavior changes. The pre-existing `omniroute/README.md` remains in place.
