## Context

See `proposal.md` for motivation and `specs/quota-placeholder/spec.md` for behavior. The manifest currently declares `"Actions": []`; the plugin entry point only sets the logger level and connects. The existing package uses the Elgato Stream Deck SDK, and the previously removed Counter-specific artwork is no longer present. Plugin-level icons remain available but are not action icons.

## Goals / Non-Goals

**Goals:**
- Declare and register a single keypad action so Stream Deck lists a draggable action named “Quota”.
- Keep that action deliberately inert and free of settings/configuration behavior.

**Non-Goals:**
- Display quota data, add a property inspector, or revive Counter functionality.
- Change plugin identity or introduce new dependencies.

## Decisions

- **Declare a keypad Action in the manifest and register its SDK action class.** The manifest entry makes the action visible/selectable to Stream Deck, while the SDK registration provides the corresponding runtime action binding. Keeping only a manifest declaration risks an action that is visible but not implemented; registering only the class would not expose it to the user.
- **Use a minimal action implementation with no event handlers or settings model.** A no-op placeholder fulfills the draggable-key use case without suggesting that quota data is already available. A dummy title/count or settings UI would introduce behavior outside the requirement.
- **Provide action-specific icon/state artwork derived from the existing plugin artwork or a simple neutral placeholder.** The action manifest requires an icon and key state image; plugin marketplace/category icons are not a substitute for action resources. Avoid bringing back any Counter-named assets.
- **Keep the existing plugin entry point lifecycle and plugin UUID.** The action is added alongside the current logger setup and Stream Deck connection; no migration of the plugin itself is needed.

## Risks / Trade-offs

- [A manifest/runtime UUID mismatch can make registration fail or the action unusable] → Use one consistent action UUID in the manifest and action registration and run Stream Deck CLI validation.
- [An empty-looking key might appear broken] → Use the “Quota” action name in the action list and a neutral action icon; do not claim quota values until the actual feature exists.

## Migration Plan

Add the action manifest declaration, matching SDK registration/implementation, and required action artwork, then build, validate, and restart the plugin. Existing plugin identity remains unchanged. Rollback removes the new action declaration, registration, implementation, and action artwork, restoring the current action-free skeleton.
