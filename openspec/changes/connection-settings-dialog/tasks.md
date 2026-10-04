## 1. Add the connection action and inspector

- [ ] 1.1 Add and register a dedicated OmniRoute connection action and add its manifest action entry/Property Inspector path; verify the manifest remains valid and Stream Deck lists the connection action.
- [ ] 1.2 Create the Property Inspector using the existing SDPI Components loading convention with two ordinary text fields and Cancel/Save controls; verify the rendered inspector contains exactly the requested fields and buttons without custom components.

## 2. Implement shared settings behavior

- [ ] 2.1 Add Property Inspector messaging for loading and saving the URL and API key through the SDK's plugin-wide settings API; verify the settings are stored together globally rather than per action instance.
- [ ] 2.2 Initialize both fields from saved global settings when the inspector opens, and implement Save and Cancel draft behavior; verify reopening pre-fills saved values and Cancel leaves them unchanged.
- [ ] 2.3 Accept empty and arbitrary field text without validation or connection tests; verify Save persists both current values as entered.

## 3. Verify integration

- [ ] 3.1 Build the plugin and resolve manifest edits additively with the in-progress Counter removal and plugin-icon changes; verify the build succeeds and the connection action remains available in the final manifest.
- [ ] 3.2 Use Stream Deck Developer Tools to exercise loading, saving, reopening from another action instance, and cancelling edits; verify the shared configuration behaves as specified.
