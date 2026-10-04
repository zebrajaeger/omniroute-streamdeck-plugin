## Context

See `proposal.md` for motivation and `specs/connection-settings/spec.md` for the behavior contract. The current plugin registers one Counter action from `omniroute/src/plugin.ts`; its manifest entry points at `de.lars-brandt.omniroute.sdPlugin/ui/increment-counter.html`. That inspector already loads the official SDPI Components library from its documented CDN release URL. The installed `@elgato/streamdeck` v3 SDK exposes plugin-wide `settings.getGlobalSettings` / `settings.setGlobalSettings` APIs and Property Inspector messaging APIs. There are no existing main specs.

Two other in-progress changes in this repository also touch the plugin manifest: `remove-counter-example` removes the Counter and leaves an action-free plugin, and `replace-plugin-icon` updates plugin artwork. The connection action must remain in the final manifest regardless of implementation order.

## Goals / Non-Goals

**Goals:**
- Make the settings inspector available through an OmniRoute action that is independent of the Counter demo.
- Keep editable draft values separate from persisted plugin-wide settings until Save is selected.
- Use SDK-supported global settings and Property Inspector messaging, plus the existing official SDPI Components library.

**Non-Goals:**
- Implement requests to OmniRoute, validate either field, or show connection status.
- Add custom UI components, a new dependency, or security behavior such as masking the key.
- Store the settings in per-action settings or make them vary by action instance.

## Decisions

- **Use a dedicated connection action and Property Inspector.** Register an OmniRoute connection action and reference its inspector in the Stream Deck manifest. This is a persistent, discoverable host for the plugin-wide form. Reusing the Counter would tie product settings to a demo action that another in-progress change removes; a global menu or external modal has no established entry point in this plugin.
- **Persist through the SDK's plugin-wide settings API.** Keep the URL and API key together as one global settings object, so all connection-action instances observe one configuration. Do not use action settings, since those are scoped per instance and would contradict the requested shared values.
- **Keep form values as drafts until explicit Save.** Use the official `sdpi-textfield` components without automatic setting persistence, initialize their values from the saved configuration when the inspector appears, and send explicit load/save messages to the plugin. The plugin reads or writes settings with the SDK and returns the saved values to the inspector. Cancel restores the last values supplied by the plugin (or clears the unsaved draft); it does not call the persistence API. Saving both fields in one operation prevents a partial configuration update.
- **Use existing official UI components and delivery conventions.** Reuse the current inspector's SDPI Components CDN loading approach and official textfield/button elements. No hand-built component or new package is needed. Keep URL and API key as ordinary text fields, as specified.
- **Coordinate manifest edits with the active changes.** Add the connection action alongside the current Counter while this change is applied, and ensure any concurrent or later Counter-removal edit removes only Counter metadata/assets, not the new action. Preserve the separate plugin-icon update. Re-read and merge the current manifest rather than replacing it wholesale.

## Risks / Trade-offs

- [The settings contain an API key in a plain text field as requested] → No extra masking or security controls are introduced; keep the value out of logs and source code and store it only in plugin-wide settings.
- [Inspector and plugin messages can arrive before saved values have been loaded] → Initialize on Property Inspector appearance, treat the initial load response as authoritative, and only enable save/cancel handling after both controls are available.
- [The in-progress Counter removal can erase the only registered action or overwrite concurrent manifest edits] → Keep the new connection action as the final manifest action and verify the combined manifest/build after integrating the related changes.
- [The existing SDPI Components library is loaded from a CDN] → Follow the existing project convention; packaging or vendoring the library is outside this change.

## Migration Plan

Add the connection action, inspector, and global-settings message handling while retaining plugin identity and SDK startup. Update the manifest additively, then build and use Stream Deck Developer Tools to confirm the action appears, the form is populated, Save persists values across reopening/action instances, and Cancel does not persist edits. No existing connection settings need migration. Rollback by removing the new action, inspector, and message handling; no saved values are consumed by other plugin behavior yet.
