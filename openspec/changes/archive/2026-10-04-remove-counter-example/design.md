## Context

See `proposal.md` for motivation and `specs/plugin-skeleton/spec.md` for required behavior. The current plugin entry point imports and registers a single Counter action; the manifest declares the same action and references its property inspector and images. The Rollup build compiles the entry point from `src/plugin.ts`, so it can continue to build an entry point with no application-level actions.

## Goals / Non-Goals

**Goals:**
- Keep the existing plugin identity and Stream Deck startup/connect lifecycle intact while removing all Counter-specific surfaces.
- Ensure manifest metadata and built output remain consistent with an action-free skeleton.

**Non-Goals:**
- Add OmniRoute quota functionality or any replacement action.
- Redesign the plugin's general marketplace/category artwork, build pipeline, dependencies, or metadata.

## Decisions

- **Keep the plugin entry point and connection lifecycle, removing only the action import and registration.** The plugin remains a valid running skeleton without an action class. Removing the entry point or connection call would leave the plugin unable to start. Moving or introducing an empty action registry is unnecessary; Stream Deck actions are provided through the manifest and SDK registration, and there will be no declarations or registrations.
- **Remove the Counter from both the manifest and its dedicated resources.** The action metadata, property inspector, and counter images describe only the sample, so retaining any of them would leave stale user-facing UI or assets. Keep the plugin-level artwork and metadata, which belong to the plugin rather than the example action.
- **Keep the existing build configuration and package dependencies.** The TypeScript/Rollup setup already builds the plugin entry point independently; no new package or architectural layer is needed for the skeleton.

## Risks / Trade-offs

- [Existing profiles or button placements referring to the Counter UUID will no longer resolve to that action] → This is an intentional removal of template behavior; no compatibility alias is planned for a sample action that is not part of OmniRoute functionality.
- [An empty action list could be confused with a packaging error] → Validate the generated plugin bundle and confirm the manifest still has all required plugin-level metadata and points to the existing entry point.

## Migration Plan

Remove the Counter implementation and user-facing metadata/resources, then build the plugin and verify the resulting bundle and manifest. No settings migration is required. Rollback consists of restoring the removed example files and declarations if the skeleton proves invalid; no plugin identity change or installation migration is planned.
