## 1. Remove the template action

- [x] 1.1 Remove the Counter action import and registration while retaining Stream Deck logging setup and the connect lifecycle; verify the TypeScript/Rollup build succeeds without the action module.
- [x] 1.2 Remove the Counter action entry from `de.lars-brandt.omniroute.sdPlugin/manifest.json`; verify the manifest remains valid and its plugin-level UUID, CodePath, icons, and metadata are preserved.
- [x] 1.3 Remove the Counter implementation, its property inspector, and its action-specific icon/key image files; verify no tracked Counter-demo source, UI, or image assets remain.

## 2. Verify the plugin skeleton

- [x] 2.1 Build the plugin using the existing build command and verify the generated bundle contains the plugin entry point, retains the existing plugin identity, and advertises no Counter action or settings UI.
- [x] 2.2 Run the Stream Deck Developer Tools/restart flow and verify the plugin starts and connects without listing a template action.
