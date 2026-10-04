## 1. Prepare the packaged icon assets

- [x] 1.1 Derive `marketplace.png` and `marketplace@2x.png` from `doc/icon-512.png` at their existing 288×288 and 512×512 dimensions, and verify both files decode at the expected sizes and visibly match the source artwork.
- [x] 1.2 Derive `category-icon.png` and `category-icon@2x.png` from `doc/icon-512.png` at their existing 28×28 and 56×56 dimensions, and verify both files decode at the expected sizes and remain recognizable.
- [x] 1.3 Confirm the manifest retains its existing plugin-level and category icon paths and that action/key artwork remains unchanged.

## 2. Verify in Stream Deck

- [x] 2.1 Verify in the Stream Deck UI (after restarting the plugin) that plugin listings/details and the action category display the supplied OmniRoute artwork without requiring the OmniRoute service to be running; `streamdeck validate` confirms the package is structurally valid.
