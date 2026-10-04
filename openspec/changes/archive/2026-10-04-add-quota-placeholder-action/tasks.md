## 1. Add the placeholder action

- [x] 1.1 Add a minimal SDK action implementation and register it in the plugin entry point using a stable UUID; verify the TypeScript/Rollup build succeeds and the entry point retains its logger/connect lifecycle.
- [x] 1.2 Declare the matching “Quota” keypad action in the Stream Deck manifest with its action UUID and required icon/state paths; verify manifest and runtime UUIDs match.
- [x] 1.3 Provide valid action-specific icon and key-state image assets without reintroducing Counter assets; verify each manifest path resolves to the expected PNG files.

## 2. Verify the visible placeholder

- [x] 2.1 Run the plugin build and Stream Deck CLI validation; verify the bundle builds, manifest validation succeeds, and the action is named “Quota” with no settings UI or Counter behavior.
- [x] 2.2 Restart the plugin in Stream Deck and verify “Quota” appears in the OmniRoute actions list and can be dragged onto a keypad key. (User confirmed the action appears and can be placed on a key.)
