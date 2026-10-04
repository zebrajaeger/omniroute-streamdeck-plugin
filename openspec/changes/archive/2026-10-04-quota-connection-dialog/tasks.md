## 1. Add the Quota Property Inspector entry point

- [x] 1.1 Add a Property Inspector for the Quota action and update its manifest path; verify Stream Deck displays the Inspector for a selected Quota key.
- [x] 1.2 Add a connection-icon button that opens a modal containing URL/API-key fields and Save/Cancel controls; verify the modal opens from the button and can be dismissed without saving.

## 2. Reuse shared connection settings

- [x] 2.1 Route modal load/save messages through the existing plugin-wide settings behavior; verify the modal loads saved values and saving from one Quota instance is visible from another.
- [x] 2.2 Implement draft, Save, and Cancel behavior using the existing form conventions; verify Save persists both values and Cancel/dismiss leaves saved values unchanged.
- [x] 2.3 Review the standalone connection action's UUID and manifest exposure for backward compatibility; verify the new Quota flow does not require placing that action and existing saved connection values remain intact.

## 3. Verify integration

- [x] 3.1 Build the plugin and validate the merged manifest/UI assets; verify the build succeeds and Quota remains registered with its Inspector.
- [x] 3.2 Use Stream Deck Developer Tools to test opening/dismissing the modal, save/cancel, prefill, and sharing between Quota instances; verify behavior matches both delta specs.
