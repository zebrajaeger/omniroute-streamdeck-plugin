## Context

See `proposal.md` for the motivation and `specs/` for the behavior contract. The current plugin registers `QuotaAction` and `ConnectionSettingsAction` from `omniroute/src/plugin.ts`. `QuotaAction` has no Property Inspector yet; the connection action currently handles load/save messages using the Stream Deck SDK's plugin-wide settings API. The current manifest and UI assets need to be inspected during implementation and edited additively to avoid losing unrelated action or branding changes.

The archived `connection-settings-dialog` design established the shared settings shape (`url`, `apiKey`), explicit load/save messaging, and SDPI Components usage. Its inline Inspector entry point is the part being corrected.

## Goals / Non-Goals

**Goals:**
- Put the entry point on Quota's own Property Inspector and present connection editing in a modal.
- Reuse the existing plugin-wide URL/API key settings and their explicit save semantics.
- Keep the action-independent settings state shared across Quota instances.

**Non-Goals:**
- Change the connection data model or add quota retrieval behavior.
- Validate values, test connectivity, mask the API key, or introduce another persistence mechanism.
- Add a new dependency or custom UI component when existing Stream Deck/SDPI conventions suffice.

## Decisions

- **Use Quota's Property Inspector as the sole user-facing launch point.** Add the connection-icon control to the Quota inspector and open a modal from it. This avoids requiring a separate key/action for settings and follows the confirmed modal requirement. Keep or remove registration/assets for the old connection action according to its remaining internal responsibilities; it must no longer be required as a user-facing settings action. Prefer consolidating the existing load/save handling with the Quota action if SDK message routing requires it, rather than duplicating independent settings implementations.
- **Reuse the existing global settings contract.** Continue reading and writing the `url` and `apiKey` values through the Stream Deck plugin-wide settings API. Do not migrate values into action-scoped settings, which would break sharing among keys.
- **Treat the modal form as a draft until Save.** On modal open, request the current global values and populate the form. Save submits both values together; Cancel closes the modal and discards unsaved edits. Reuse official SDPI components and available host-supported modal behavior; do not build a custom component.
- **Make the modal host-compatible.** The Quota inspector is hosted by Stream Deck, so use a modal mechanism supported in that Property Inspector environment (for example, native dialog behavior if supported by the host's Chromium version). Keep modal semantics—overlay, focus containment, and explicit dismissal—rather than opening another inspector or OS-level dialog.

## Risks / Trade-offs

- [The modal element or presentation may vary with the Stream Deck embedded browser version] → Verify in Stream Deck Developer Tools; use a compatible modal presentation and ensure keyboard/close behavior works.
- [SDK Property Inspector messages may be action-scoped even though values are global] → Confirm Quota receives the load/save events and route them to the existing global settings behavior without duplicating or desynchronizing state.
- [Removing the connection action may impact an existing user's placed keys] → Keep compatibility in mind: the user-facing flow should be Quota, but do not silently invalidate action UUIDs or existing placements without explicitly deciding and testing the migration behavior.
- [Manifest and UI changes overlap with other archived changes] → Read the current manifest and merge narrowly; preserve existing Quota action registration and branding.

## Migration Plan

Update the Quota manifest entry to point to its Property Inspector, add the modal trigger/form, and route load/save through global settings. Verify saved settings still prefill and remain shared across Quota instances, and that cancel/dismiss does not persist edits. Confirm the standalone Connection Settings entry point is no longer needed for the intended flow. Avoid deleting legacy UUID handling unless compatibility consequences have been reviewed. Roll back by restoring the prior Quota Inspector/manifest behavior; the global settings data remains unchanged.
